#!/bin/env bash
# =============================================================================
#        File: schedule.sh           
#       Usage: nohup ./schedule.sh &> schedule.log &
# Description: ---
#     Options: ---
#      Author: gavin, gavin-fu@outlook.com
#     Created: 20190118
# =============================================================================
# 环境配置
set -f
home="$(cd $(dirname $0) 2> /dev/null; pwd)"
log_home="${home}/log"
module_home="${home}/module"
crontab="${home}/crontab"

# 脚本退出机制
fix_timed_exit=true         # 是否定时退出 true/false
exits_date=                 # 退出日，默认当天
exits_hour=                 # 退出时，默认23时
exits_minute=               # 退出分，默认59分

_check_start()
{
    for (( i=0; i<${#present[@]}; i++)); do
        [[ "${items[i]}" = '*' ]] && continue
        echo "${items[i]}" |grep -wq "${present[i]}"
        [ $? -ne 0 ] && return 1
    done
    return 0
}

exits_seconds=$(date -d "${exits_date:-$(date +%F)} ${exits_hour:-23}:${exits_minute:-59}" +%s)
while true; do
    if [[ "$fix_timed_exit" = 'true' ]]; then
        [ $(date +%s) -ge $exits_seconds ] && break
    fi
    
    present=($(date +"%-M %-H %-d %-m %-u")) # Minute Hour Day Month Week
    while read line; do
        {
            items=($line)
            module="$(echo ${line} |awk '{print $6}')"
            options="${line#*${module}}"
            
            _check_start
            if [ $? -eq 0 ]; then
                log_file="${log_home}/$(date +%Y%m%d)/${module}.log"
                script="$(eval echo ${module_home}/${module}/main.sh ${options})"
                
                [ ! -d "${log_file%/*}" ] && mkdir -p "${log_file%/*}"
                printf "$(date +%F\ %H:%M:%S) [INFO] %s\n" "Start ${module} module batch processing..." >> "$log_file"
                printf "$(date +%F\ %H:%M:%S) [INFO] %s\n" "Command: ${script}" >> "$log_file"
                
                $script >> "$log_file" 2>&1
            fi
        } &
    done < <(grep -e '^\s*$' -e '^\s*#' -v "$crontab")
    
    sleep 60
done
