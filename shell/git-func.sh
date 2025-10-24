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


# 判断是否git目录
isGitDir()
{
    local path=$1
    ls -a $path |grep -w '.git' > /dev/null 2>&1
}


# 拉取最新代码
pull_branch()
{
    local path=$1

    branch_un_modified $path
    if [ $? -ne 0 ]; then
        echo "存在修改内容，请手动处理当前项目 [$path]"
        return
    fi

    echo -e "Pull $path"

    branch_pull $path
}


# 检出分支
checkout_branch()
{
    local path=$1
    local branch=$2

    cd $path

    # 判断分支是否能切换
    branch_un_modified $path
    if [ $? -ne 0 ]; then
        echo "存在修改内容，请手动处理当前项目 [$path]"
        return 1
    fi

    # 当前本地分支等于检出分支， 直接pull最新代码
    branch_match $path $branch
    if [ $? -eq 0 ]; then
        branch_pull $path $branch
        return $?
        
    fi
    
    # 切换本地分支
    branch_exist $path $branch
    if [ $? -eq 0 ]; then
        git checkout $branch
        branch_pull $path $branch
        return $?
    fi

    # 拉取远程分支
    branch_remote_exist $path $branch
    if [ $? -ne 0 ]; then
        echo "未找到相关分支. Path: [$path], Branch: [$branch]"
        return 1
    fi
    git checkout -b $branch "origin/$branch"
}
    

# 拉取代码
branch_pull()
{
    local path=$1
    local branch=$2

    cd $path
    if [[ -n $branch ]]; then
        git pull origin $branch
        if [ $? -eq 0 ]; then
            return 0
        fi
    fi

    git pull
    if [ $? -ne 0 ]; then
        echo "Pull失败，请手动处理当前项目 [$path]"
        return 1
    fi
}

# 判断分支是否存在
branch_exist()
{
    local path=$1
    local branch=$2

    cd $path
    local match_branch_size=$(git branch -a |grep -E "^\**\s*$branch$" |wc -l)
    test $match_branch_size -gt 0
}

branch_remote_exist()
{
    branch_exist $1 "remotes/origin/$2"
}

# 分支修改检测
branch_un_modified()
{
    local path=$1

    cd $path
    local modified_size=$(git status |grep '修改' |wc -l)
    test $modified_size -eq 0
}

# 检测当前分支是否与需要检出分支匹配
branch_match()
{
    local path=$1
    local branch=$2


    local current_branch=$(branch_get $path)
    test $current_branch = $branch
}

# 获取指定路径下当前的git分支
branch_get()
{
    local path=$1

    cd $path
    local current_branch=$(git branch -l |grep '*')
    echo ${current_branch:2}
}


# 修改分支名
renameGitBranch()
{
    local gitPath=$1    # git地址
    local oldBranch=$2  # 老分支
    local newBranch=$3  # 新分支

    cd $gitPath
    if [ $? -ne 0 ]; then
        echo "Git地址不存在 [$gitPath]"
        exit 1
    fi

    # 修改分支名
    git branch -m $oldBranch $newBranch
    if [ $? -ne 0 ]; then
        echo "修改分支失败 [$oldBranch] -> [$newBranch]"
        exit 1
    fi

    # 删除远程老分支
    branch_remote_exist $oldBranch
    if [ $? -ne 0 ]; then
        git push --delete origin $oldBranch
    fi

    # 推送分支到远程仓库
    git push origin $newBranch
    if [ $? -ne 0 ]; then
        echo "推送分支到远程仓库失败 [$newBranch]"
        exit 1
    fi

    # 关联远程仓库分支
    git branch --set-upstream-to origin/$newBranch
    if [ $? -ne 0 ]; then
        echo "关联远程仓库分支失败 [$newBranch]"
    fi
}
