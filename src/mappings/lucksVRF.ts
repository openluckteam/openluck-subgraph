import {
    Task, RandomResult
} from "../../generated/schema";

import {
    ReqRandomNumber, RspRandomNumber
} from "../../generated/LucksVRF/LucksVRF";


export function handleReqRandomNumber(event: ReqRandomNumber): void {
    let taskId = event.params.taskId.toString();
    let requestId = event.params.requestId.toHexString();
    let task = Task.load(taskId);
    if (task) {
        let ID = taskId + "-" + requestId;
        let evt = RandomResult.load(ID);
        if (!evt) {
            evt = new RandomResult(ID);
            evt.task = taskId;
            evt.max = event.params.max;
            evt.requestId = event.params.requestId;
            evt.timestamp = event.block.timestamp;
            evt.txHash = event.transaction.hash;
            evt.save();
        }
    }
}


export function handleRspRandomNumber(event: RspRandomNumber): void {
    let taskId = event.params.taskId.toString();
    let requestId = event.params.requestId.toHexString();
    let task = Task.load(taskId);
    if (task) {
        let ID = taskId + "-" + requestId;
        let evt = RandomResult.load(ID);
        if (!evt) {
            evt = new RandomResult(ID);
            evt.task = taskId;
            evt.requestId = event.params.requestId;
            evt.randomness = event.params.randomness;
            evt.number = event.params.number;
            evt.timestamp = event.block.timestamp;
            evt.txHash = event.transaction.hash;
            evt.save();
        }
    }
}