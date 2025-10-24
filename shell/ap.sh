#!/bin/bash
set -e

TOKEN=""
GITLAB_HOST="git2.superboss.cc"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
BOLD='\033[1m'
NC='\033[0m' # 无颜色

# 打印脚本使用说明
print_usage() {
    echo -e "${CYAN}使用方法:${NC} $0 [合并请求URL1] [合并请求URL2] ..."
    echo -e "${CYAN}示例:${NC} $0 https://git2.superboss.cc/erp/erp-core/merge_requests/15128"
}

# 检查提交是否在main分支中
check_commits_in_main() {
    local host=$1
    local encoded_project_path=$2
    local mr_id=$3
    local project_path=$4
    
    commits_info=$(curl -s --request GET \
        --header "PRIVATE-TOKEN: $TOKEN" \
        "http://$host/api/v4/projects/$encoded_project_path/merge_requests/$mr_id/commits")
    
    # 计算提交数量
    if command -v jq &> /dev/null; then
        commit_count=$(echo "$commits_info" | jq '. | length')
        echo -e "${BOLD}${BLUE}本次合并请求共包含 ${commit_count} 个提交${NC}"
        
        # 获取提交的最早和最晚时间
        earliest_date=$(echo "$commits_info" | jq -r '[.[].created_at] | min')
        latest_date=$(echo "$commits_info" | jq -r '[.[].created_at] | max')
    else
        # 对于不支持jq的情况，我们使用grep和sort来获取日期
        all_dates=$(echo "$commits_info" | grep -o '"created_at":"[^"]*"' | cut -d'"' -f4)
        earliest_date=$(echo "$all_dates" | sort | head -1)
        latest_date=$(echo "$all_dates" | sort | tail -1)
    fi
    
    # GitLab API 需要 ISO 8601 格式（含时区信息）
    # 我们不需要改变时区信息，只需要确保格式正确，并调整日期
    # 提取当前日期时区信息
    timezone_part=$(echo "$earliest_date" | grep -o '+[0-9]\{2\}:[0-9]\{2\}$' || echo '+08:00')
    
    # 添加时间缓冲（前后各1天）
    if command -v date &> /dev/null; then
        # 先将日期部分提取出来，不包含时区
        earliest_date_main=$(echo "$earliest_date" | sed 's/+[0-9]\{2\}:[0-9]\{2\}$//')
        latest_date_main=$(echo "$latest_date" | sed 's/+[0-9]\{2\}:[0-9]\{2\}$//')
        
        # 使用date命令调整日期
        earliest_with_buffer=$(date -v -1d -j -f '%Y-%m-%dT%H:%M:%S.000' "$earliest_date_main" '+%Y-%m-%dT%H:%M:%S.000Z')
        latest_with_buffer=$(date -v +1d -j -f '%Y-%m-%dT%H:%M:%S.000' "$latest_date_main" '+%Y-%m-%dT%H:%M:%S.000Z')
        
        # 添加回时区信息
        earliest_date_with_buffer="${earliest_with_buffer}${timezone_part}"
        latest_date_with_buffer="${latest_with_buffer}${timezone_part}"
    else
        # 如果date命令不可用，直接使用原始日期
        earliest_date_with_buffer=$earliest_date
        latest_date_with_buffer=$latest_date
    fi
    
    # 对URL中的日期参数进行正确的URL编码
    earliest_date_encoded=$(echo "$earliest_date_with_buffer" | sed 's/:/%3A/g' | sed 's/+/%2B/g')
    latest_date_encoded=$(echo "$latest_date_with_buffer" | sed 's/:/%3A/g' | sed 's/+/%2B/g')
    
    # 获取main分支在指定时间范围内的提交，使用正确的参数名 ref_name
    main_commits=$(curl -s --request GET \
        --header "PRIVATE-TOKEN: $TOKEN" \
        "http://$host/api/v4/projects/$encoded_project_path/repository/commits?ref_name=main&since=$earliest_date_encoded&until=$latest_date_encoded&per_page=100")
    
    # 提取main分支所有提交哈希
    if command -v jq &> /dev/null; then
        main_commit_hashes=$(echo "$main_commits" | jq -r '.[].id')
    else
        main_commit_hashes=$(echo "$main_commits" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    fi
    
    # 标记是否有未合并的提交
    local has_unmerged=false
    
    # 逐个检查合并请求中的提交
    if command -v jq &> /dev/null; then
        while read -r commit; do
            commit_hash=$(echo "$commit" | jq -r '.id')
            commit_title=$(echo "$commit" | jq -r '.title')
            commit_author=$(echo "$commit" | jq -r '.author_name')
            commit_date=$(echo "$commit" | jq -r '.created_at')
            
            # 过滤掉merge相关提交
            if [[ "$commit_title" == *"Merge "* ]] || [[ "$commit_title" == *"merge "* ]]; then
                continue
            fi
            
            # 检查提交是否在main分支中
            if echo "$main_commit_hashes" | grep -q "$commit_hash"; then
                echo -e "${GREEN}✓ ${GRAY}$commit_hash${NC} - ${BLUE}已合并到main${NC}"
            else
                echo -e "${RED}✗ ${GRAY}$commit_hash${NC} - ${YELLOW}未合并到main${NC}"
                echo -e "   ${BOLD}提交信息:${NC} $commit_title"
                echo -e "   ${BOLD}作者:${NC} $commit_author"
                echo -e "   ${BOLD}时间:${NC} $commit_date"
                has_unmerged=true
            fi
        done < <(echo "$commits_info" | jq -c '.[]')
    else
        # 备用方案，不使用jq
        commit_lines=$(echo "$commits_info" | grep -o '{[^}]*}')
        while read -r commit_line; do
            commit_hash=$(echo "$commit_line" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
            commit_title=$(echo "$commit_line" | grep -o '"title":"[^"]*"' | cut -d'"' -f4)
            commit_author=$(echo "$commit_line" | grep -o '"author_name":"[^"]*"' | cut -d'"' -f4)
            commit_date=$(echo "$commit_line" | grep -o '"created_at":"[^"]*"' | cut -d'"' -f4)
            
            # 过滤掉merge相关提交
            if [[ "$commit_title" == *"Merge "* ]] || [[ "$commit_title" == *"merge "* ]]; then
                continue
            fi
            
            # 检查提交是否在main分支中
            if echo "$main_commit_hashes" | grep -q "$commit_hash"; then
                echo -e "${GREEN}✓ ${GRAY}$commit_hash${NC} - ${BLUE}已合并到main${NC}"
            else
                echo -e "${RED}✗ ${GRAY}$commit_hash${NC} - ${YELLOW}未合并到main${NC}"
                echo -e "   ${BOLD}提交信息:${NC} $commit_title"
                echo -e "   ${BOLD}作者:${NC} $commit_author"
                echo -e "   ${BOLD}时间:${NC} $commit_date"
                has_unmerged=true
            fi
        done < <(echo "$commit_lines")
    fi
    # 总结检查结果
    if "$has_unmerged"; then
        echo -e "${BOLD}${YELLOW}⚠️ 有提交尚未合并到main分支，请检查${NC}"
    else
        echo -e "${BOLD}${GREEN}✅ 所有提交已成功合并到main分支${NC}"
    fi
}

# 处理单个合并请求的函数
process_merge_request() {
    local url=$1
    
    # 从URL中提取项目路径和合并请求ID
    if [[ $url =~ https?://([^/]+)/([^/]+/[^/]+)/merge_requests/([0-9]+) ]]; then
        local host=${BASH_REMATCH[1]}
        local project_path=${BASH_REMATCH[2]}
        local mr_id=${BASH_REMATCH[3]}
        
        # 对项目路径进行URL编码用于API调用
        local encoded_project_path=$(echo "$project_path" | sed 's|/|%2F|g')
        
        # 首先，获取合并请求详情以检查当前状态
        mr_details=$(curl -s --request GET \
            --header "PRIVATE-TOKEN: $TOKEN" \
            "http://$host/api/v4/projects/$encoded_project_path/merge_requests/$mr_id")
        
        # 从响应中提取相关信息 - 使用更可靠的jq工具（如果可用）
        if command -v jq &> /dev/null; then
            # 使用jq解析JSON（推荐方式）
            merge_status=$(echo "$mr_details" | jq -r '.state')
            can_be_merged=$(echo "$mr_details" | jq -r '.merge_status')
            
            # 获取额外信息
            title=$(echo "$mr_details" | jq -r '.title')
            source_branch=$(echo "$mr_details" | jq -r '.source_branch')
            target_branch=$(echo "$mr_details" | jq -r '.target_branch')
            author=$(echo "$mr_details" | jq -r '.author.name')
            merged_by=$(echo "$mr_details" | jq -r '.merged_by.name // "未知"')
        else
            # 备用方案：使用grep提取信息
            merge_status=$(echo "$mr_details" | grep -o '"state":"[^"]*"' | head -1 | cut -d'"' -f4)
            can_be_merged=$(echo "$mr_details" | grep -o '"merge_status":"[^"]*"' | head -1 | cut -d'"' -f4)
            
            # 获取额外信息
            title=$(echo "$mr_details" | grep -o '"title":"[^"]*"' | head -1 | cut -d'"' -f4)
            source_branch=$(echo "$mr_details" | grep -o '"source_branch":"[^"]*"' | head -1 | cut -d'"' -f4)
            target_branch=$(echo "$mr_details" | grep -o '"target_branch":"[^"]*"' | head -1 | cut -d'"' -f4)
            author=$(echo "$mr_details" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
            merged_by=$(echo "$mr_details" | grep -o '"merged_by":{[^}]*"name":"[^"]*"' | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
            [ -z "$merged_by" ] && merged_by="未知"
        fi
        
        # 获取批准者信息
        approvals_info=$(curl -s --request GET \
            --header "PRIVATE-TOKEN: $TOKEN" \
            "http://$host/api/v4/projects/$encoded_project_path/merge_requests/$mr_id/approvals")
        
        # 解析批准信息
        if command -v jq &> /dev/null; then
            user_has_approved=$(echo "$approvals_info" | jq -r '.user_has_approved')
            user_can_approve=$(echo "$approvals_info" | jq -r '.user_can_approve')
            approvals_required=$(echo "$approvals_info" | jq -r '.approvals_required')
            approvals_left=$(echo "$approvals_info" | jq -r '.approvals_left')
            
            # 获取最后一个批准者（如果有批准者）
            approver_count=$(echo "$approvals_info" | jq -r '.approved_by | length')
            if [ "$approver_count" -gt 0 ]; then
                last_approver=$(echo "$approvals_info" | jq -r ".approved_by[$approver_count-1].user.name")
                has_been_approved=true
            else
                last_approver="未知"
                has_been_approved=false
            fi
            
            # 获取所有批准者
            all_approvers=$(echo "$approvals_info" | jq -r '.approved_by[].user.name' 2>/dev/null)
        else
            # 备用方案，使用grep提取（注意这不太可靠）
            user_has_approved=$(echo "$approvals_info" | grep -o '"user_has_approved":\(true\|false\)' | cut -d':' -f2)
            user_can_approve=$(echo "$approvals_info" | grep -o '"user_can_approve":\(true\|false\)' | cut -d':' -f2)
            approvals_required=$(echo "$approvals_info" | grep -o '"approvals_required":[0-9]*' | cut -d':' -f2)
            approvals_left=$(echo "$approvals_info" | grep -o '"approvals_left":[0-9]*' | cut -d':' -f2)
            
            # 尝试获取批准者名称
            approvers=$(echo "$approvals_info" | grep -o '"approved_by":\[[^]]*\]')
            if [[ "$approvers" == *"name"* ]]; then
                last_approver=$(echo "$approvers" | grep -o '"name":"[^"]*"' | tail -1 | cut -d'"' -f4)
                has_been_approved=true
                all_approvers=$(echo "$approvers" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
            else
                last_approver="未知"
                has_been_approved=false
                all_approvers=""
            fi
        fi
        
        # 显示详细信息
        echo -e "${BOLD}${PURPLE}----------------------------------------${NC}"
        echo -e "${BOLD}${BLUE}📌 标题:${NC} $title"
        echo -e "${BOLD}${YELLOW}👤 作者:${NC} $author"
        echo -e "${BOLD}${CYAN}🔀 源分支:${NC} ${GREEN}$source_branch${NC} ${BOLD}→${NC} ${GREEN}$target_branch${NC}"
        echo -e "${BOLD}${GRAY}🔄 当前状态:${NC} $merge_status, ${BOLD}可合并状态:${NC} $can_be_merged"
        
        # 显示批准和合并状态
        if [ "$has_been_approved" = true ]; then
            echo -e "${BOLD}${GREEN}👍 合并请求已被 [${YELLOW}$last_approver${GREEN}] 批准${NC}"
            # 显示所有批准者（如果有多个）
            if [ "$(echo "$all_approvers" | wc -l)" -gt 1 ]; then
                echo -e "${BOLD}${GREEN}   所有批准者:${NC}"
                echo "$all_approvers" | while read -r approver; do
                    echo -e "   ${YELLOW}→ $approver${NC}"
                done
            fi
        fi
        
        if [ "$merge_status" = "merged" ]; then
            echo -e "${BOLD}${GREEN}✅ 合并请求已被 [${YELLOW}$merged_by${GREEN}] 合并${NC}"
            
            # 检查提交是否已合并到main分支
            check_commits_in_main "$host" "$encoded_project_path" "$mr_id" "$project_path"
            
            echo -e "${BOLD}${PURPLE}----------------------------------------${NC}"
            return 0
        fi
        
        if [ "$merge_status" = "closed" ]; then
            echo -e "${BOLD}${RED}❌ 合并请求已关闭${NC}"
            echo -e "${BOLD}${PURPLE}----------------------------------------${NC}"
            return 0
        fi
        
        # 执行批准操作（如果用户可以批准且尚未批准）
        if [ "$user_can_approve" = "true" ] && [ "$user_has_approved" != "true" ]; then
            echo -e "${CYAN}正在批准合并请求...${NC}"
            approve_result=$(curl -s --request POST \
                --header "PRIVATE-TOKEN: $TOKEN" \
                "http://$host/api/v4/projects/$encoded_project_path/merge_requests/$mr_id/approve")
            
            if [[ "$approve_result" == *"approved"* ]] || [[ "$approve_result" == *"已批准"* ]] || [[ "$approve_result" == *"already approved"* ]]; then
                echo -e "${BOLD}${GREEN}✅ 批准成功${NC}"
            else
                echo -e "${BOLD}${YELLOW}⚠️ 批准状态:${NC} $approve_result"
            fi
        elif [ "$user_has_approved" = "true" ]; then
            echo -e "${BOLD}${GREEN}✅ 您已经批准过此合并请求${NC}"
        elif [ "$user_can_approve" != "true" ]; then
            echo -e "${BOLD}${YELLOW}⚠️ 您没有权限批准此合并请求${NC}"
        fi
        
        # 检查是否可以合并
        if [ "$can_be_merged" = "can_be_merged" ] || [ "$can_be_merged" = "checking" ]; then
            # 合并请求
            echo -e "${CYAN}正在合并请求...${NC}"
            merge_result=$(curl -s --request PUT \
                --header "PRIVATE-TOKEN: $TOKEN" \
                "http://$host/api/v4/projects/$encoded_project_path/merge_requests/$mr_id/merge")
            
            if [[ "$merge_result" == *"merge_commit_sha"* ]]; then
                echo -e "${BOLD}${GREEN}✅ 合并成功${NC}"
                
                # 提取合并提交的 SHA
                if command -v jq &> /dev/null; then
                    merge_commit_sha=$(echo "$merge_result" | jq -r '.merge_commit_sha')
                else
                    merge_commit_sha=$(echo "$merge_result" | grep -o '"merge_commit_sha":"[^"]*"' | cut -d'"' -f4)
                fi
                
                echo -e "${BOLD}${BLUE}🔗 合并提交:${NC} ${GRAY}$merge_commit_sha${NC}"
                
                # 检查提交是否已合并到main分支
                check_commits_in_main "$host" "$encoded_project_path" "$mr_id" "$project_path"
            else
                echo -e "${BOLD}${RED}❌ 合并失败:${NC} $merge_result"
            fi
        else
            echo -e "${BOLD}${RED}❌ 合并请求无法被合并，状态:${NC} $can_be_merged"
            # 根据不同状态添加更详细的错误处理
            if [[ "$mr_details" == *"\"has_conflicts\":true"* ]]; then
                echo -e "   ${YELLOW}原因:${NC} 存在冲突，需要手动解决"
            elif [[ "$mr_details" == *"\"work_in_progress\":true"* ]]; then
                echo -e "   ${YELLOW}原因:${NC} 这是一个进行中的工作，标记为WIP/Draft"
            elif [[ "$mr_details" == *"\"blocked_by_approval_rules\":true"* ]]; then
                echo -e "   ${YELLOW}原因:${NC} 被批准规则阻止"
            fi
        fi
        
        echo -e "${BOLD}${PURPLE}----------------------------------------${NC}"
    else
        echo -e "${BOLD}${RED}❌ 无效的合并请求 URL:${NC} $url"
        return 1
    fi
}

# 检查是否至少有一个参数
if [ $# -eq 0 ]; then
    print_usage
    exit 1
fi

echo -e "${BOLD}${BLUE}👉 开始处理 $# 个合并请求${NC}"
echo -e "${BOLD}${PURPLE}----------------------------------------${NC}"

# 处理每个作为参数提供的URL
for url in "$@"; do
    process_merge_request "$url"
done

echo -e "${BOLD}${GREEN}✨ 所有合并请求处理完成${NC}"