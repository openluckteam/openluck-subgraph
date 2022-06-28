import {
    Task, AutoCloseFail
} from "../../generated/schema";

import {
    RevertInvoke
} from "../../generated/LucksAutoCloseTask/lucksAutoCloseTask";


export function handleRevertInvoke(event: RevertInvoke): void {
    let taskId = event.params.taskId.toString();
    let reason = event.params.reason;
    let task = Task.load(taskId);
    if (task) {
        let ID = taskId + "-" +  event.logIndex.toString();;
        let evt = AutoCloseFail.load(ID);
        if (!evt) {
            evt = new AutoCloseFail(ID);
            evt.task = taskId;
            evt.reason = reason;
            evt.timestamp = event.block.timestamp;
            evt.txHash = event.transaction.hash;
            evt.save();
        }
    }
}