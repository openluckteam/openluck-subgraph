import {
    Task, AutoDrawFail
} from "../../generated/schema";

import {
    RevertInvoke
} from "../../generated/LucksAutoDrawTask/lucksAutoDrawTask";


export function handleRevertInvoke(event: RevertInvoke): void {
    let taskId = event.params.taskId.toString();
    let reason = event.params.reason;
    let task = Task.load(taskId);
    if (task) {
        let ID = taskId + "-" +  event.logIndex.toString();;
        let evt = AutoDrawFail.load(ID);
        if (!evt) {
            evt = new AutoDrawFail(ID);
            evt.task = taskId;
            evt.reason = reason;
            evt.timestamp = event.block.timestamp;
            evt.txHash = event.transaction.hash;
            evt.save();
        }
    }
}