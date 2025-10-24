#!/bin/bash


echo "hello"

PS3="请选择一个操作："
options=("查看文件" "编辑文件" "退出")
select opt in "${options[@]}"; do
    case $opt in
        "查看文件")
            echo "您选择了查看文件操作"
            ;;
        "编辑文件")
            echo "您选择了编辑文件操作"
            ;;
        "退出")
            break
            ;;
        *)
            echo "无效的选项"
            ;;
    esac
done