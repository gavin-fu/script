#!/bin/bash
# =============================================================================
#        File:          
#       Usage: 
# Description: 编译本地测试分支
#     Options: 
#      Author: 
#     Created: 20230207
# =============================================================================

. "$(cd $(dirname $0) 2> /dev/null; pwd)/git-func.sh"

DEV_BRANCH=main
ROOT_PATH=/Users/gavin/projects/work/erp/erp-dev

build()
{
    local path=$ROOT_PATH/$1
    local branch=$2

    if [ -z $branch ]; then
        branch=$DEV_BRANCH
    fi

    cd $path
    git pull
    checkout_branch $path $branch
    if [ $? -ne 0 ]; then
        echo "检出开发分支失败."
        return
    fi

    mvn clean install -T 10C -Dmaven.compile.fork=true -Dmaven.test.skip=true -DfailOnError=false -DinstallAtEnd=true
}


if [ 'base' == $1 ]; then 
    build erp-core && build erp-items-core && build erp-wms wuming/main && build erp-platform && build erp-pt

    exit
fi

build $1 $2
