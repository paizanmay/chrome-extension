
var $RCCompoment = '<div class="circularToggleButtonView  circularToggleButtonView--toggledOff  circularToggleButtonView--recentlyToggled taskCheckboxNodeView "><div class="circularButtonView circularToggleButtonView-button circularButtonView--small circularButtonView--onWhiteBackground circularButtonView--active"><span class="circularButtonView-label">CR</span></div></div>';

var taskRCStatus = {};

var currentUrl = "";

var asanaFirebaseRef = new Firebase("https://asana-rc-status.firebaseio.com/");
asanaFirebaseRef.on("value", function(snapshot) {
    taskRCStatus = snapshot.val() || {};
    SetRCCompomentStatus();
}, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
});

function SetRCCompomentStatus(){
    for(var taskID in taskRCStatus){
        if(taskRCStatus[taskID]['isRC']){
            ActiveRCStyle(taskID);
        }
        else{
            UnactiveRCStyle(taskID);
        }
    }
}

function ChangeRCStatus(taskID){
    var changeFirebaseStatus = function(taskID){
        if(taskRCStatus[taskID]['isRC']){
            asanaFirebaseRef.child(taskID).update({
                'isRC':false
            });
        }
        else{
            asanaFirebaseRef.child(taskID).update({
                'isRC':true
            });
        }
    }

    if(taskRCStatus[taskID]==undefined){
        asanaFirebaseRef.child(taskID).set({
            'taskID':taskID,
            'isRC':true
        }, function(){
            changeFirebaseStatus(taskID);
        });
    }
    changeFirebaseStatus(taskID);
    
}

function AddRCIconToTask(task_id){
    var $taskCompoment = $("#item_row_view_"+task_id);
    var $newRCCompoment = $taskCompoment.find(".grid-cell").eq(1).append($RCCompoment);
    $newRCCompoment.unbind();
    $newRCCompoment.on("click", function(event){
        var target = $(event.target);
        var targetTaskID = target.parentsUntil("tbody").last().attr('id').split("_")[3];
        ChangeRCStatus(targetTaskID);
    });
}

function AddRCIconToAllTask(){
    var $allTask = $("#center_pane_container").find(".task-row");
    for(var i=0; i<$allTask.length; i++){
        var taskRawID = $allTask.eq(i).attr('id');
        var taskID = taskRawID.split("_")[3]
        AddRCIconToTask(taskID);
    }

}

function ActiveRCStyle(taskID){
    var $taskCompoment = $("#item_row_view_"+taskID);
    $taskCompoment.find(".grid-cell").eq(1).children().eq(1).find('.circularButtonView').css('background-color', 'blue');
}

function UnactiveRCStyle(taskID){
    var $taskCompoment = $("#item_row_view_"+taskID);
    $taskCompoment.find(".grid-cell").eq(1).children().eq(1).find('.circularButtonView').css('background-color', 'white');
}

MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

function Init(){
    var DOMReadyObserver = new MutationObserver(function(mutations, observer) {
        console.log('DOM change')
        if(document.getElementById("grid") != null){  // If the main content table is loaded, add listener to it and remove the listener on document
            // Here is project initial function
            taskObserver.observe($("#grid").find("tbody")[0], {
                childList: true,
            });
            AddRCIconToAllTask();
            observer.disconnect();
        }
    });

    DOMReadyObserver.observe(document, {  // Its purpose to add listener to document is to listen whether main content table is loaded
      subtree: true,
      childList: true,
    });

    var taskObserver = new MutationObserver(function(mutations, observer) {
        if(mutations.length==1){
            if(mutations[0].addedNodes.length>0){  // add new task
                var changeTask = $(mutations[0].addedNodes[0]);
                AddRCIconToTask(changeTask.attr("id").split("_")[3]);
            }
            else{  // delete task
                var changeTask = $(mutations[0].removedNodes[0]);
                asanaFirebaseRef.child(changeTask.attr("id").split("_")[3]).remove();
            }
            
        }
    });
}

chrome.runtime.onMessage.addListener(function(msg, sender){
    if(currentUrl == "" || msg.url.split("/")[4] != currentUrl.split("/")[4]){
        currentUrl = msg.url;
        Init();
    }
});