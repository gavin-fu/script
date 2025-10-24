#!/bin/bash


# erp-core          5487
# erp-platform      407
# erp-items-core    2900
# erp-trade-project 3494
# erp-item-project  4165

DEFAULT_PROJECT_ID=5487
DEFAULT_TARGE_BRANCH=gray3/240515


sourceBranch=$1
if [ -z $sourceBranch ]; then
    echo '分支不能为空'
    exit 1
fi

targeBranch=$2
if [ -z $targeBranch ]; then
    targeBranch=$DEFAULT_TARGE_BRANCH
fi

projectId=''
project=$3
if [ -z $project ]; then
    projectId=$DEFAULT_PROJECT_ID
fi



url="https://git2.superboss.cc/erp/erp-core/merge_requests/new?utf8=✓&merge_request[source_project_id]=${projectId}&merge_request[source_branch]=${sourceBranch}&merge_request[target_project_id]=${projectId}&merge_request[target_branch]=${targeBranch}"


'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge' $url



