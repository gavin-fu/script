#!/bin/bash


declare -a GIT_PROJECTS=()

add_project() {
    local key=$1
    local value=$2
    GIT_PROJECTS+=("$key:$value")
}

get_project_code() {
    local key=$1
    for item in "${GIT_PROJECTS[@]}"; do
        if [[ $item == $key:* ]]; then
            echo "${item#*:}"
            return
        fi
    done
    echo ""
}

add_project "erp-core" "5487"
add_project "erp-platform" "407"
add_project "erp-items-core" "2900"
add_project "erp-trade-project" "3494"
add_project "erp-item-project" "4165"
add_project "erp-oms-stock" "5332"
