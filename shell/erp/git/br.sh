#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # 重置颜色

# 获取脚本所在目录
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
CONF_FILE="${SCRIPT_DIR}/br.conf"

# 初始化配置存储结构
project_names=()    # 项目名称数组
project_paths=()    # 项目路径数组
env_names=()        # 环境名称数组
env_branches=()     # 环境分支数组
gitlab_token=""

# 加载配置文件
load_config() {
    [ -f "$CONF_FILE" ] || touch "$CONF_FILE"
    while IFS= read -r line; do
        if [[ $line =~ ^project_([^=]+)=\"(.*)\"$ ]]; then
            local name=${BASH_REMATCH[1]}
            local path=${BASH_REMATCH[2]}
            # 移除旧位置并添加到末尾
            project_names=("${project_names[@]/$name}")
            project_names+=("$name")
            project_paths+=("$path")
        elif [[ $line =~ ^env_([^=]+)=\"(.*)\"$ ]]; then
            local name=${BASH_REMATCH[1]}
            local branch=${BASH_REMATCH[2]}
            env_names=("${env_names[@]/$name}")
            env_names+=("$name")
            env_branches+=("$branch")
        elif [[ $line =~ ^gitlab_token=\"(.*)\"$ ]]; then
            gitlab_token=${BASH_REMATCH[1]}
        fi
    done < "$CONF_FILE"
}

# 保存配置文件（结构化格式）
save_config() {
    {
        echo "# GitLab Token"
        echo "gitlab_token=\"$gitlab_token\""
        echo -e "\n# Projects (名称->路径)"
        for i in "${!project_names[@]}"; do
            echo "project_${project_names[$i]}=\"${project_paths[$i]}\""
        done
        echo -e "\n# Environments (环境->分支)"
        for i in "${!env_names[@]}"; do
            echo "env_${env_names[$i]}=\"${env_branches[$i]}\""
        done
    } > "$CONF_FILE"
}

# 初始化加载配置
load_config

# 帮助信息
showHelp() {
    echo -e "${BLUE}使用方法:${NC}"
    echo "  br.sh [选项]"
    echo
    echo -e "${BLUE}选项:${NC}"
    echo "  -h           显示帮助信息"
    echo "  -e [环境配置] 初始化/修改环境配置（格式：环境名称:分支名称）"
    echo "  -p [项目配置] 初始化/修改项目配置（格式：项目名称:项目路径）"
    echo "  -t [token]   设置/修改 GitLab Token"
    echo "  -lp          列出所有已配置项目"
    echo "  -le          列出所有已配置环境"
    echo "  -l           列出所有配置信息"
    echo
    echo -e "${BLUE}示例:${NC}"
    echo "  br.sh -e 灰度1:feature/1.0"
    echo "  br.sh -p erp-core:/path/to/project"
    echo "  br.sh -t your_gitlab_token"
}

# 验证 GitLab Token
tokenValidate() {
    [ -n "$gitlab_token" ] || {
        echo -e "${YELLOW}GitLab Token 未配置，请先执行 br.sh -t <token> 进行配置${NC}"
        exit 1
    }
}

# 初始化环境配置
envInit() {
    local input=$1
    if [ -z "$input" ]; then
        while true; do
            read -p "$(echo -e "${BLUE}请输入环境名称（输入 'q' 退出）:${NC}")" env_name
            [ "$env_name" == "q" ] && break
            read -p "$(echo -e "${BLUE}请输入分支名称:${NC}")" branch_name
            # 更新环境配置
            if [[ " ${env_names[@]} " =~ " ${env_name} " ]]; then
                # 如果环境已存在，更新分支
                for i in "${!env_names[@]}"; do
                    if [[ "${env_names[$i]}" == "$env_name" ]]; then
                        env_branches[$i]=$branch_name
                        break
                    fi
                done
            else
                # 如果环境不存在，添加到数组
                env_names+=("$env_name")
                env_branches+=("$branch_name")
            fi
        done
    else
        IFS=':' read -r env_name branch_name <<< "$input"
        if [[ " ${env_names[@]} " =~ " ${env_name} " ]]; then
            # 如果环境已存在，更新分支
            for i in "${!env_names[@]}"; do
                if [[ "${env_names[$i]}" == "$env_name" ]]; then
                    env_branches[$i]=$branch_name
                    break
                fi
            done
        else
            # 如果环境不存在，添加到数组
            env_names+=("$env_name")
            env_branches+=("$branch_name")
        fi
    fi
    save_config
}

# 初始化项目配置
projectInit() {
    local input=$1
    if [ -z "$input" ]; then
        while true; do
            read -p "$(echo -e "${BLUE}请输入项目名称（输入 'q' 退出）:${NC}")" project_name
            [ "$project_name" == "q" ] && break
            read -p "$(echo -e "${BLUE}请输入项目路径:${NC}")" project_path
            # 更新项目配置
            if [[ " ${project_names[@]} " =~ " ${project_name} " ]]; then
                # 如果项目已存在，更新路径
                for i in "${!project_names[@]}"; do
                    if [[ "${project_names[$i]}" == "$project_name" ]]; then
                        project_paths[$i]=$project_path
                        break
                    fi
                done
            else
                # 如果项目不存在，添加到数组
                project_names+=("$project_name")
                project_paths+=("$project_path")
            fi
        done
    else
        IFS=':' read -r project_name project_path <<< "$input"
        if [[ " ${project_names[@]} " =~ " ${project_name} " ]]; then
            # 如果项目已存在，更新路径
            for i in "${!project_names[@]}"; do
                if [[ "${project_names[$i]}" == "$project_name" ]]; then
                    project_paths[$i]=$project_path
                    break
                fi
            done
        else
            # 如果项目不存在，添加到数组
            project_names+=("$project_name")
            project_paths+=("$project_path")
        fi
    fi
    save_config
}

# 列表显示函数
listProjects() {
    echo -e "${BLUE}已配置项目:${NC}"
    for i in "${!project_names[@]}"; do
        echo -e "${GREEN}${project_names[$i]}${NC}\t-> ${project_paths[$i]}"
    done
}

listEnvs() {
    echo -e "${BLUE}已配置环境:${NC}"
    for i in "${!env_names[@]}"; do
        echo -e "${GREEN}${env_names[$i]}${NC}\t-> ${env_branches[$i]}"
    done
}

listAll() {
    echo -e "${BLUE}当前配置信息:${NC}"
    echo -e "${GREEN}[GitLab Token]${NC}\n$gitlab_token"
    listProjects
    listEnvs
}

# 选择项目和环境
selectProjectAndEnv() {
    tokenValidate
    [ "${#project_names[@]}" -gt 0 ] || {
        echo -e "${YELLOW}没有配置项目，请先执行 br.sh -p 初始化项目${NC}"
        exit 1
    }
    [ "${#env_names[@]}" -gt 0 ] || {
        echo -e "${YELLOW}没有配置环境，请先执行 br.sh -e 初始化环境${NC}"
        exit 1
    }

    # 选择项目
    echo -e "${BLUE}请选择项目:${NC}"
    select project in "${project_names[@]}"; do
        [ -n "$project" ] && break
        echo -e "${RED}无效的选择，请重新输入序号。${NC}"
    done
    for i in "${!project_names[@]}"; do
        if [[ "${project_names[$i]}" == "$project" ]]; then
            project_path="${project_paths[$i]}"
            break
        fi
    done

    # 多选环境
    echo -e "${BLUE}请选择环境（可多选，用空格分隔序号）:${NC}"
    for i in "${!env_names[@]}"; do
        echo "$((i+1))) ${env_names[$i]} (${env_branches[$i]})"
    done

    while :; do
        read -r -a indices
        [ "${#indices[@]}" -gt 0 ] && break
        echo -e "${RED}请至少选择一个环境。${NC}"
    done

    selected_envs=()
    for index in "${indices[@]}"; do
        (( idx = index - 1 ))
        [ "${idx}" -ge 0 -a "${idx}" -lt "${#env_names[@]}" ] && selected_envs+=("${env_names[$idx]}")
    done

    # 输入源分支
    read -p "$(echo -e "${BLUE}请输入源分支名称:${NC}")" source_branch


    # 创建合并请求
    for env in "${selected_envs[@]}"; do
        for i in "${!env_names[@]}"; do
            if [[ "${env_names[$i]}" == "$env" ]]; then
                target_branch="${env_branches[$i]}"
                break
            fi
        done
        commit_msg="Merge branch '${source_branch}' into '${target_branch}'"

        response=$(curl -s -X POST \
            -H "PRIVATE-TOKEN: $gitlab_token" \
            "http://git2.superboss.cc/api/v4/projects/erp%2F${project}/merge_requests" \
            -d "source_branch=${source_branch}" \
            -d "target_branch=${target_branch}" \
            -d "title=${commit_msg}")

        if web_url=$(jq -r .web_url <<< "$response"); then
            status=$(jq -r .merge_status <<< "$response")
            color="$GREEN"
            [[ "$status" == "cannot_be_merged" ]] && color="$RED"
            echo -e "${color}${env}:${NC} $web_url"
        else
            error=$(jq -r '.message | join(", ")' <<< "$response")
            echo -e "${RED}${env}失败: ${error}${NC}"
        fi
    done
}

# 主逻辑处理
case "$1" in
    -h) showHelp ;;
    -e) shift; envInit "$@" ;;
    -p) shift; projectInit "$@" ;;
    -t)
        [ -z "$2" ] && { echo -e "${RED}必须指定Token值${NC}"; exit 1; }
        gitlab_token="$2"
        save_config
        echo -e "${GREEN}Token 已更新${NC}"
        ;;
    -lp) listProjects ;;
    -le) listEnvs ;;
    -l)  listAll ;;
    *)   selectProjectAndEnv ;;
esac