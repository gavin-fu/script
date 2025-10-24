#!/bin/bash
# shellcheck disable=SC1068
# shellcheck disable=SC2034
# shellcheck disable=SC1061
# shellcheck disable=SC1073
# shellcheck disable=SC2128

#projectId projectName
#2900 erp-items-core
#402 erp-core
#694 erp-caigou
#698 erp-pda
#407 erp-platform
#406 erp-pt
#3115 erp-share

branch_name=$1;
acesss_token="secret.robotmanagertoken";
reduction="false";

help() {
    echo "这个脚本用来禁止目标分支合并代码"
    echo "usage: sh $0 needProtectBranch"
    echo "example: sh $0 gray3/210903"
    echo "==========================="
    echo "如果不慎操作，以下为还原操作"
    echo "usage: sh $0 --unProtect needReductionBranch"
    echo "example: sh $0 --unProtect gray3/210903"
}

if [[ $1 = "--help" ]] || [[ $1 = "-h" ]] || [[ $1 = "" ]] || [[ $1 = "-help" ]]
  then
    help
    exit 0
fi

if [[ $1 = "--unProtect" ]]
  then
    reduction="true";
    branch_name=$2;
fi

for project_id in 2900 402 694 698 407 406 3115
do
    cmd="curl http://dispatcher-req.superboss.cc/dispatcher/git/protectBranch?diamondCoord=$acesss_token\&projectId=$project_id\&branchName=$branch_name\&reduction=$reduction"
    eval "$cmd"
done
    echo "执行成功！！！"
