#!/bin/bash
# =============================================================================
#        File:          
#       Usage: 
# Description: git目录统一操作
#     Options: checkout 检出分支、 pull最新代码、 status 数出项目分支
#      Author: 
#     Created: 20230203
# =============================================================================
# set -x

. "$(cd $(dirname $0) 2> /dev/null; pwd)/git-func.sh"

# 入口
main()
{
    local path=$1
    local func=$2
    local branch=$3
    
    # echo "Starting"
    while read line; do
        process ${line%/.git} $func $branch
    done < <(find $path -name .git)
    # echo "Finished"
}

# 操作处理
process()
{
    local path=$1
    local func=$2
    local branch=$3

    if [ $path == '/Users/gavin/Projects/erp-dev/erp-dev' ]; then
        return
    fi
    if [ $path == '/Users/gavin/Projects/erp-dev/erp-core' ]; then
        return
    fi

    case "$func" in
        'pull')
            pull_branch $path
            ;;
        'checkout')
            checkout_branch $path $branch
            ;;
        'status')
            echo "${path##*/} -> $(branch_get $path)"
            ;;
        '*')
            echo "Unsuport option $func."
            ;;
    esac
}

ROOT_PATH=/Users/gavin/Projects

main $ROOT_PATH/$1 $2 $3

