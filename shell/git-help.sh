#!/bin/bash
# ============================================
#
#
# ============================================



function help() {
	echo "usage:"
	echo "-change [原分支名] 目标分支名"
	echo "-merge 目标分支名 [原分支名]"
	echo "-approve 目标分支名 [原分支名]"
	echo "-checkout 目标分支名 [原分支名]"
	echo "-pull 目标分支名 [原分支名]"
}

function current_branch() {
	echo $(git branch --show-current)
}

function change_branch() {
	origin=$(current_branch)
	if [[ $# -lt 1 || $# -gt 2 ]]; then
		echo "参数不合法 -> " $@
		exit 1
	fi
	if [[ $# -eq 1 ]]; then
		target=$1
	fi
	if [[ $# -eq 2 ]]; then
		origin=$1
		target=$2
	fi
	echo $origin
	echo $target
	if [[ $origin == $(current_branch) ]]; then
		git checkout master
		echo 9999
	fi
	# git branch -m <旧分支名> <新分支名>
	# git push origin :<旧分支名> <新分支名>
}

function merge_branch() {
	echo $@
}

function approve_merge() {
	echo $@
}

function checkout_branch() {
	echo $@
}

function pull_branch() {
	echo $@
}


if [[ $# -eq 0 ]]; then
	current_branch
else
	command=$1
	shift
	case "$command" in
		-h|--help)
      		help
      		;;
    	-change)
      		change_branch $@
      		;;
  		-merge)
			merge_branch $@
			;;
		-approve)
			approve_merge $@
			;;
		-checkout)
			checkout_branch $@
			;;
		-pull)
			pull_branch $@
			;;
		*)
      		;;
  	esac
fi

