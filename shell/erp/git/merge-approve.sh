#!/bin/bash

jixing_token=McocJmk6YSr4qCx8subu
ROOT_PATH="$(cd $(dirname $0) 2> /dev/null; pwd)"
source "$ROOT_PATH/projects.sh"

token="-QY8_uzM2WwT5QyD_yZz"
project=$(get_project_code erp-core)
merge_request_id=0
is_merge=0

while [[ $# -gt 0 ]]; do
    case "$1" in
        -p)
            project=$(get_project_code "$2")
            shift 2
        	;;
        -m)
			is_merge=1
			shift
			;;
		-o)
			token="$jixing_token"
			shift
			;;
        *)
			merge_request_id=$1
			shift
        	;;
    esac
done


if [[ merge_request_id -eq 0 ]]; then
	printf "project: %s, merge_request_id: %s, is_merge: %s\n" $project $merge_request_id $is_merge
	echo "参数不合法"
fi

curl --request POST --header "PRIVATE-TOKEN: $token" "http://git2.superboss.cc/api/v4/projects/$project/merge_requests/$merge_request_id/approve"
if [[ is_merge -eq 1 ]]; then
	curl --request PUT --header "PRIVATE-TOKEN: $token" "http://git2.superboss.cc/api/v4/projects/$project/merge_requests/$merge_request_id/merge"
fi
printf "project: %s, merge_request_id: %s, is_merge: %s\n" $project $merge_request_id $is_merge