# schedule
Shell批量调度脚本



## 脚本目录结构

```
 script/
    |- crontab
    |- env.sh
    |- schedule.sh		-- 主脚本
    |
    |- lib/		    	-- 函数库
    |	|- func_comm.sh	-- 通用函数
    |	|- func_date.sh	-- 日期函数
    |	|- func_db.sh	-- 数据库函数
    |	|- func_log.sh	-- 日志函数
    |	|- func_util.sh	-- 工具函数
    |
    |- module/			-- 批量脚本	
        |- module1/		-- 模块1
        |	|- main.sh	-- 模块入口 
        |	|- config	-- 模块配置文件
        |
        |- module2/		-- 模块2
        |- ……/
```



## 日志目录结构

```
LOG_HOME/
	|- schedule
	|	|- yyyymmdd
	|		|- module1.log
	|		|- ……
	|
	|- module/
		|- module1/
			|- ……
```

