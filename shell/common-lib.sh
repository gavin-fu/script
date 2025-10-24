#!/bin/env bash
#=======================================================
#       File: func-comm.sh
#     Coding: utf-8
#     Author: gavin
#       Mail: gavinfu@yeah.net
#    Created: 2017/12/24
#   Describe: 通用方法
#=======================================================

# Parameters:   -
# Describe:     获取当前脚本 (引用当前函库的脚本) 的路径
# Sample:       file_getDir
function file_getDir()
{
    # local funcScript="${BASH_SOURCE[0]}"
    # local invoScript="${BASH_SOURCE[@]##${funcScript}}"
    # 若调用脚本引入多个脚本上段代码存在问题
    local dirPath="$(cd $(dirname $0) 2> /dev/null; pwd)"
    echo "$dirPath"
}


# Parameters:   1 : file - 文件名
# Describe:     获取文件的绝对路径
# Sample:       file_getAbsPath ../test.txt
function file_getAbsPath()
{
    local prefix="$(echo "$1" |cut -c1)"
    if [[ "$prefix" = '/' ]]; then
        echo "$1"
    elif [[ "$prefix" = '.' ]]; then
        local path="$(cd $(dirname "$1") 2> /dev/null; pwd)"
        echo "${path}/${1#*/}"
    else
        local path="$(file_getDir)"
        echo "${path}/${1}"
    fi
}

# Parameters:   1 : file - 文件名
# Describe:     创建文件
# Sample:       file_create ./file_create.txt
function file_create()
{
    local file=$(file_getAbsPath "$1")
    local dir=${file%/*}

    [ -d "$dir" ] || mkdir -p "$dir"
    touch "$file"
}

# Parameters:   1 : file - 文件名
# Describe:     初始化文件
# Sample:       file_init ./file_init.txt
function file_init()
{
    local file=$(file_getAbsPath "$1")
    if [ -f "$file" ]; then
        > "$file"
    else
        file_create "$file"
    fi
}

# Parameters:   1 : [length] - UUID长度
# Describe:     获取指定长度UUID，默认10位
# Sample:       uuid_get
function uuid_get()
{
    local length=${1:-10}
    local uuid=
    
    if [[ -r '/proc/sys/kernel/random/uuid' ]]; then
        uuid="$(cat '/proc/sys/kernel/random/uuid' |cksum |cut -d ' ' -f1)"
    elif [[ -r '/dev/urandom' ]]; then
        uuid="$(head -1 '/dev/urandom' |cksum |cut -d ' ' -f1)"
    elif declare -p RANDOM &> /dev/null; then
        uuid="$(echo $RANDOM$RANDOM)"
    else
        uuid="$(date +%N)"
    fi

    if [ ${#uuid} -lt $length ]; then
        length=$(expr $length - ${#uuid})
        uuid="$uuid$(uuid_get $length)"
        echo "$uuid"
    elif [ ${#uuid} -gt $length ]; then
        echo "${uuid:0:$length}"
    else
        echo "$uuid"
    fi
}

# Parameters:   1 : mgs 命令描述
# Describe:     判断命令是否执行异常(返回值 > 0),若执行异常则退出脚本
# Sample:       comm_errExit "comm_errExit"
function comm_errExit()
{
    local commReturn=$?
    if [ $commReturn -ne 0 ]; then
        echo "~~~ Run command failure ~~~"
        echo "CommandMSG: $1"
        echo "Retrun:     $commReturn"
        exit $commReturn
    fi
}
