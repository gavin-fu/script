#!/bin/bash

ROOT_PATH=/Users/gavin/projects/work/erp/erp-core

ENVS=("gray1" "gray2" "gray3" "gray4" "gray5" "gray6" "vip" "preissue1" "preissue2" "prod")

MATCH_PARTTENT1="origin/env/[0-9]{6}$"
MATCH_PARTTENT2="origin/release/1.[0-9]{3}.env_[0-9]{6}$"
MATCH_PARTTENT3="origin/release/1.[0-9]{3}.0$"


show_version() {
	local parttent=""
	case "$1" in
		gray|gray1)
			parttent="${MATCH_PARTTENT1/env/gray1}"
			;;
		gray2|gray3|gray4|gray5|gray6)
			parttent="${MATCH_PARTTENT1/env/$1}"
			;;
		vip)
			parttent="${MATCH_PARTTENT1/env/vip}"
			;;
		pre|preissue|preissue1)
			parttent="${MATCH_PARTTENT2/env/preissue}"
			;;
		pre2|preissue2)
			parttent="${MATCH_PARTTENT2/env/preissue2}"
			;;
		pro|prod)
			parttent="$MATCH_PARTTENT3"
			;;
	esac
	if [[ -z $parttent ]]; then
		echo "参数不正确" $@
		exit 1
	fi


	# erp_version=$(cd $ROOT_PATH; git pull >/dev/null 2>&1; git branch -r |grep -E "$parttent" |sort -r |head -n 1)
	local erp_version=$(
		cd $ROOT_PATH
		if [[ $is_ignore_pull -eq 0 ]]; then
			git pull >/dev/null 2>&1
		fi
		git branch -r |grep -E "$parttent" |sort -r |head -n 1
	)
	if [[ -z $erp_version ]]; then
		echo "git branch -r |grep -E "$parttent" |sort -r |head -n 1"
		exit 1
	fi

	echo -e "\033[32m$1 version:\033[0m ${erp_version#*/}"
}


is_ignore_pull=1
erp_v=""
while [[ $# -gt 0 ]]; do
    case "$1" in
        -p)
            is_ignore_pull=0
        	;;
        *)
			erp_v="$1"
        	;;
    esac
    shift
done
if [[ -n $erp_v ]]; then
	show_version "$erp_v"
	exit
fi


if [[ $is_ignore_pull -eq 0 ]]; then
		$(cd $ROOT_PATH; git pull >/dev/null 2>&1)
		is_ignore_pull=1
	fi
for e in "${ENVS[@]}"; do
	show_version $e
done




