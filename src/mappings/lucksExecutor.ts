import { Address, BigInt, log } from "@graphprotocol/graph-ts";

import { findOrCreateUser } from "../utils";

import {
    Task, CancelEvent, CloseEvent, JoinEvent,
    PickWinnerEvent, ClaimEvent, Ticket, UserJoinTask, GroupEvent
} from "../../generated/schema";

import {
    CreateTask, CancelTask, CloseTask, JoinTask, ClaimToken, PickWinner, CreateTickets, JoinTaskCall
} from "../../generated/LucksExecutor/LucksExecutor";

enum TaskStatus {
    Pending,
    Open,
    Close,
    Success,
    Fail,
    Cancel
}

/**
 * Handler called when the `CreateTask` Event is called on the LucksExecutor Contract
 * @param event
 */
export function handleCreateTask(event: CreateTask): void {

    let taskId = event.params.taskId;
    let item = event.params.item;
    let ext = event.params.ext;
    let seller = item.seller.toHexString();

    findOrCreateUser(seller);

    let task = Task.load(taskId.toString());
    if (!task) {
        task = new Task(taskId.toString());
    }

    task.taskId = taskId;
    task.seller = seller;
    task.chainId = ext.chainId;
    task.nftChainId = item.nftChainId;
    task.nftContract = item.nftContract;
    task.tokenIds = item.tokenIds;
    task.tokenAmounts = item.tokenAmounts;

    task.title = ext.title;
    task.note = ext.note;

    task.acceptToken = item.acceptToken;
    task.status = item.status;
    task.startTime = item.startTime;
    task.endTime = item.endTime;

    task.targetAmount = item.targetAmount;
    task.price = item.price;
    task.amountCollected = BigInt.fromI32(0);
  
    task.exclusiveToken = item.exclusiveToken.token;
    task.exclusiveAmount = item.exclusiveToken.amount;
    task.finalNumber = 0;
    task.paymentStrategy = item.paymentStrategy;
    task.depositId = item.depositId;
    task.claimed = false;
    task.timestamp = event.block.timestamp;
    task.txHash = event.transaction.hash;

    task.save();
}


export function handleCancelTask(event: CancelTask): void {
    let taskId = event.params.taskId.toString();
    let task = Task.load(taskId);
    if (task) {
        let evt = CancelEvent.load(taskId);
        if (!evt) {
            evt = new CancelEvent(taskId);
            evt.task = taskId;
            evt.seller = task.seller;
            evt.timestamp = event.block.timestamp;
            evt.txHash = event.transaction.hash;
            evt.save();

            // update task
            task.status = TaskStatus.Cancel;
            task.save();
        }
    }
}

export function handleCloseTask(event: CloseTask): void {
    let taskId = event.params.taskId.toString();
    let task = Task.load(taskId);
    if (task) {
        let evt = CloseEvent.load(taskId);
        if (!evt) {
            evt = new CloseEvent(taskId);
            evt.task = taskId;
            evt.caller = event.params.caller.toHexString();
            evt.status = event.params.status;
            evt.timestamp = event.block.timestamp;
            evt.txHash = event.transaction.hash;
            evt.save();

            // update task
            task.status = evt.status;
            task.save();
        }
    }
}

export function handleJoinTask(event: JoinTask): void {
    let taskId = event.params.taskId.toString();

    let task = Task.load(taskId);
    if (task) {
        let buyer = event.params.buyer.toHexString();
        findOrCreateUser(buyer);

        // join event
        let joinId = taskId + "-" + buyer + "-" + event.params.number.toString();
        let evt = JoinEvent.load(joinId);
        if (!evt) {

            evt = new JoinEvent(joinId);
            evt.task = taskId;
            evt.buyer = event.params.buyer.toHexString();
            evt.amount = event.params.amount;
            evt.count = event.params.count;
            evt.number = event.params.number.toI32();
            evt.note = event.params.note;
            evt.timestamp = event.block.timestamp;
            evt.txHash = event.transaction.hash;
            evt.save();

            // update task
            task.amountCollected = task.amountCollected.plus(evt.amount);
            task.lastTicketId += evt.number;

            task.save();
        }

        // user joined tasks
        let userJoinId = taskId + "-" + buyer;
        let userJoinTask = UserJoinTask.load(userJoinId);
        if (!userJoinTask) {
            userJoinTask = new UserJoinTask(userJoinId);
            userJoinTask.user = buyer;
            userJoinTask.task = taskId;    
            userJoinTask.joins = [joinId];
            userJoinTask.save();
        }
        else {
            userJoinTask.joins.push(joinId);
            userJoinTask.save();
        }
    }
}

export function handlePickWinner(event: PickWinner): void {
    let taskId = event.params.taskId.toString();
    let task = Task.load(taskId);
    if (task) {
        let evt = PickWinnerEvent.load(taskId);
        if (!evt) {
            evt = new PickWinnerEvent(taskId);
            evt.task = taskId;
            evt.winner = event.params.winner.toHexString();
            evt.number = event.params.number.toI32();
            evt.timestamp = event.block.timestamp;
            evt.txHash = event.transaction.hash;
            evt.save();

            // update task
            task.status = TaskStatus.Success;
            task.finalNumber = evt.number;

            // win GroupEvent
            let groupEventId = taskId + '-' + evt.winner;
            let groupEvent = GroupEvent.load(groupEventId);
            if (groupEvent) {
                task.winGroup = groupEvent.group;
            }

            task.save();
        }
    }
}

export function handleCreateTickets(event: CreateTickets): void {
    let taskId = event.params.taskId.toString();
    let start = event.params.start;
    let number = event.params.end;
    let count = number.minus(start).plus(BigInt.fromI32(1)).toI32();
    let task = Task.load(taskId);
    if (task) {

        let joinId = taskId + "-" + event.params.buyer.toHexString() + "-" + number.toString();

        let ticketID = taskId + "-" + number.toString();
        let ticket = Ticket.load(ticketID);
        if (!ticket) {
            ticket = new Ticket(ticketID);
            ticket.task = taskId;
            ticket.owner = event.params.buyer.toHexString();
            ticket.number = number.toI32();
            ticket.count = count;
            ticket.joinEvent = joinId;
            ticket.save();
        }

    }
}

export function handleClaimToken(event: ClaimToken): void {
    //uint256 taskId, address caller, uint256 amount, address acceptToken
    let taskId = event.params.taskId.toString();
    let task = Task.load(taskId);
    if (task) {
        let ID = taskId + "-" + event.params.caller.toHexString() + "-" + event.logIndex.toString();
        let evt = ClaimEvent.load(ID);
        if (!evt) {
            evt = new ClaimEvent(ID);
            evt.task = taskId;
            evt.caller = event.params.caller.toHexString();
            evt.amount = event.params.amount;
            evt.acceptToken = event.params.acceptToken;
            evt.timestamp = event.block.timestamp;
            evt.txHash = event.transaction.hash;
            evt.save();
        }

         // user joined tasks
         let userJoinId = taskId + "-" +  event.params.caller.toHexString();
         let userJoinTask = UserJoinTask.load(userJoinId);
         if (userJoinTask) {
            userJoinTask.claimed = true;
            userJoinTask.save();
         }
    }
}