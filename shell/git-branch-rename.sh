#!/bin/bash
# =============================================================================
#        File:          
#       Usage: 
# Description: 修改分支名称
#     Options: 
#      Author: 
#     Created: 
#     Example: gitrename <new branch name> [old branch name]
# =============================================================================

. "$(cd $(dirname $0) 2> /dev/null; pwd)/git-func.sh"

GIT_PATH="$(pwd)"
isGitDir $GIT_PATH
if [ $? -ne 0 ]; then
    echo "当前目录非Git目录 [$GIT_PATH]"
    exit 1
fi


newBranch=$1
if [[ -n $newBranch ]]; then
    branch_exist $GIT_PATH $newBranch
    if [ $? -eq 0 ]; then
        echo "当前分支已存在 [$newBranch]"
        exit 1
    fi

    branch_remote_exist $GIT_PATH $newBranch
    if [ $? -eq 0 ]; then
        echo "当前分支已存在 [$newBranch]"
        exit 1
    fi
else
    echo "修改的新分支名不能为空"
    exit 1
fi


oldBranch=$2
if [[ -n $oldBranch ]]; then
    branch_exist $GIT_PATH $oldBranch
    if [ $? -ne 0 ]; then
        echo "分支未找到 [$oldBranch]"
        exit 1
    fi
    checkout_branch $GIT_PATH $oldBranch
else
    oldBranch=$(branch_get $GIT_PATH)
fi


renameGitBranch $GIT_PATH $oldBranch $newBranch
echo "修改完成"




