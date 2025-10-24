#!/bin/bash

#######################################
#            配置区域（修改这里）            #
#######################################

API_URL="https://git2.superboss.cc/api/v4"
PROJECT_ID="664"
TOKEN="McocJmk6YSr4qCx8subu"

# 预设快捷命令配置（格式：参数名:REF值:变量值）
PRESETS=(
  "cr:Gray3_INR_CI:erp-core"
  "c:Gray3_CI:erp-core"
)

# 可选的REF分支列表
REF_OPTIONS=(
  "Gray1_CI"
  "Gray2_CI"
  "Gray3_CI"
  #"Gray3_INR_CI"
  "Gray4_CI"
  "Gray5_CI"
  "Gray6_CI"
  "Preissue_CI"
  "Preissue2_CI"
  "VIP_CI"
)

# 可选的变量值列表
VALUE_OPTIONS=(
  "erp-core"
  "erp-platform"
  "erp-pt"
  "erp-items-core"
)

#######################################
#          核心逻辑（不要修改）            #
#######################################

# 参数处理函数
function show_help() {
  echo -e "\033[1m使用说明：\033[0m"
  echo "交互模式： ci"
  echo "快速模式： ci [预设参数]"
  echo "批量模式： ci -b"
  echo -e "\n\033[1m可用预设参数：\033[0m"
  for preset in "${PRESETS[@]}"; do
    IFS=':' read -r key ref value <<< "$preset"
    printf "  %-5s => REF: %-12s PROJECT: %s\n" "$key" "$ref" "$value"
  done
  exit 0
}

# 初始化模式标志
batch_mode=0

# 解析选项参数
while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      show_help
      ;;
    -b)
      batch_mode=1
      shift
      ;;
    *)
      break
      ;;
  esac
done

# 触发流水线函数
function trigger_pipeline() {
  local ref="$1"
  local value="$2"

  JSON_DATA=$(cat <<EOF
{
  "ref": "$ref",
  "variables": [
    {
      "key": "project",
      "value": "$value"
    }
  ]
}
EOF
  )

  response=$(curl -sS -X POST \
    -H "PRIVATE-TOKEN: $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$JSON_DATA" \
    "$API_URL/projects/$PROJECT_ID/pipeline")

  if [ $? -eq 0 ]; then
    pipeline_id=$(grep -o '"id":[0-9]*' <<< "$response" | cut -d':' -f2 | head -n1)

    response=$(curl -sS -X GET \
      -H "PRIVATE-TOKEN: $TOKEN" \
      "$API_URL/projects/$PROJECT_ID/pipelines/$pipeline_id/jobs")

    web_url=$(grep -o '"web_url":"[^"]*' <<< "$response" | cut -d'"' -f4 | head -n3 | tail -n1)

    if [[ -n "$web_url" && -n "$pipeline_id" ]]; then
      echo -e "\033[32m✔ 流水线触发成功！REF: $ref project: $value\033[0m"
      echo "流水线ID: $pipeline_id"
      echo "$web_url" | pbcopy
      echo "访问地址（已copy到剪切板）: $web_url"
      open $web_url
      return 0
    else
      echo -e "\033[31m⚠ 响应数据异常，REF: $ref\033[0m"
      echo "$response"
      return 1
    fi
  else
    echo -e "\033[31m✘ 请求失败，REF: $ref\033[0m"
    echo "详细错误："
    echo "$response"
    return 1
  fi
}

# 交互选择函数（支持多选）
function interactive_selector() {
  local prompt="$1"
  local multi_select="$2"
  shift 2
  local options=("$@")
  local selected=()

  echo "$prompt" >&2
  PS3="请输入选项编号（多个用空格分隔）：" >&2

  # 显示选项列表
  for i in "${!options[@]}"; do
    printf "%3d) %s\n" $((i+1)) "${options[$i]}" >&2
  done

  while true; do
    read -p "选择（多个用空格分隔）: " -a choices
    for choice in "${choices[@]}"; do
      if [[ "$choice" =~ ^[0-9]+$ && $choice -ge 1 && $choice -le ${#options[@]} ]]; then
        selected+=("${options[$((choice-1))]}")
      else
        echo "无效选项: $choice 将被忽略" >&2
      fi
    done
    if [ ${#selected[@]} -gt 0 ]; then
      if [ "$multi_select" == "single" ]; then
        echo "${selected[0]}"
        break
      else
        printf "%s\n" "${selected[@]}"
        break
      fi
    else
      echo "至少需要选择一个有效选项" >&2
    fi
  done
}

# 处理预设参数
if [ $# -eq 1 ] && [ "$batch_mode" -eq 0 ]; then
  found=0
  for preset in "${PRESETS[@]}"; do
    IFS=':' read -r key preset_ref preset_value <<< "$preset"
    if [ "$1" == "$key" ]; then
      selected_ref="$preset_ref"
      selected_value="$preset_value"
      echo -e "\033[33m使用预设配置：$1 => REF=$selected_ref PROJECT=$selected_value\033[0m"
      found=1
      break
    fi
  done

  if [ $found -eq 0 ]; then
    echo -e "\033[31m错误：无效预设参数 '$1'\033[0m"
    exit 1
  fi
  trigger_pipeline "$selected_ref" "$selected_value"
  exit $?
fi

# 主流程
echo -e "\033[33mGray3_INR_CI为增量模式\033[0m" >&2

if [ "$batch_mode" -eq 1 ]; then
  # 批量模式处理
  echo -e "\033[36m=== 批量模式 ===\033[0m"

  # 多选REF
  selected_refs=($(interactive_selector "请选择要触发的REF分支（可多选）：" "multi" "${REF_OPTIONS[@]}"))

  # 多选VALUE并用逗号拼接
  selected_values=($(interactive_selector "请选择要设置的变量值（可多选）：" "multi" "${VALUE_OPTIONS[@]}"))
  joined_values=$(IFS=,; echo "${selected_values[*]}")

  # 循环触发所有选中的REF
  for ref in "${selected_refs[@]}"; do
    trigger_pipeline "$ref" "$joined_values"
    echo "----------------------------------------"
  done
else
  # 原交互模式处理
  selected_ref=$(interactive_selector "请选择要触发的REF分支：" "single" "${REF_OPTIONS[@]}")
  selected_value=$(interactive_selector "请选择要设置的变量值：" "single" "${VALUE_OPTIONS[@]}")
  trigger_pipeline "$selected_ref" "$selected_value"
fi