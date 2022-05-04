import {
    Group, GroupEvent
} from "../../generated/schema";

import {
    CreateGroup, JoinGroup,
} from "../../generated/LucksGroup/LucksGroup";


/**
 * Handler called when the `CreateGroup` Event is called on the LucksGroup Contract
 * @param event
 */
export function handleCreateGroup(event: CreateGroup): void {

    let taskId = event.params.taskId;
    let groupId = event.params.groupId;
    let seat = event.params.seat;    
    let user = event.params.user;

    let id = taskId.toString() + "-" + groupId.toString();
    let group = Group.load(id);
    if (!group) {
        group = new Group(id);
    }
    group.owner = user.toHexString();
    group.task = taskId.toString();
    group.seat = seat;
    group.groupId = groupId;
    group.joins = 1;   
    group.save();    

    // joinGroup
    let joinId = taskId.toString() + "-" + user.toHexString();
    let evt = GroupEvent.load(joinId);
    if (!evt) {
        evt = new GroupEvent(joinId);
        evt.task = taskId.toString();
        evt.user = user.toHexString();
        evt.group = id;
        evt.txHash = event.transaction.hash;
        evt.timestamp = event.block.timestamp;
        evt.save();
    }
}

export function handleJoinGroup(event: JoinGroup): void {
    let taskId = event.params.taskId;
    let groupId = event.params.groupId;    
    let user = event.params.user;

    let joinId = taskId.toString() + "-" + user.toHexString();
    let evt = GroupEvent.load(joinId);
    if (!evt) {
        evt = new GroupEvent(joinId);
        evt.task = taskId.toString();
        evt.user = user.toHexString();
        evt.group = taskId.toString() + "-" + groupId.toString();
        evt.txHash = event.transaction.hash;
        evt.timestamp = event.block.timestamp;
        evt.save();
    }
    
    let group = Group.load(taskId.toString() + "-" + groupId.toString());
    if (group){
        group.joins += 1;
        group.save();
    }
}