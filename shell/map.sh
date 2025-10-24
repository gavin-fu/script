#!/bin/bash


# 定义一个模拟的 Map
declare -a map=()

# 添加键值对
map_put() {
    local key=$1
    local value=$2
    map+=("$key:$value")
}

# 获取值
map_get() {
    local key=$1
    for item in "${map[@]}"; do
        if [[ $item == $key:* ]]; then
            echo "${item#*:}"
            return
        fi
    done
    echo ""
}

# 删除键值对
map_remove() {
    local key=$1
    map=($(printf '%s\n' "${map[@]}" | grep -v "^$key:"))
}


# map_put "erp-core" "5487"
# map_remove "erp-core"
# $(map_get "$2")