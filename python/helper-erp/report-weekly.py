import os
import re
import json
import shutil
import sqlite3
import requests
import browser_cookie3
from datetime import datetime, timedelta

DAYS = 1
START_DATE = '2025-07-19'
END_DATE = '2025-07-26'


def timestamp(dateStr):
    return datetime.strptime(dateStr, '%Y-%m-%d').timestamp()


def getCookies(domain):
    cookies = browser_cookie3.edge()
    return [c for c in cookies if domain == c.domain]


def getEdgeCookies():
    edge_path = os.path.expanduser('~/Library/Application Support/Microsoft Edge/Default/Cookies')
    temp_path = '/tmp/edge_cookies_temp.db'
    
    # 复制文件到临时目录
    shutil.copyfile(edge_path, temp_path)
    
    # 连接数据库并查询
    conn = sqlite3.connect(temp_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name, value, host_key, expires_utc FROM cookies")
    
    for name, value, domain, expiry in cursor.fetchall():
        if 'superbos' in domain:
            print(f'name: {name}, Domain: {domain}, Value: {value}')
        # 转换时间戳（Edge时间戳从1601年开始）
        # expiry_time = datetime(1601, 1, 1) + datetime.timedelta(microseconds=expiry)
        # print(f"Name: {name}, Domain: {domain}, Value: {value}, Expires: {expiry}")
    
    conn.close()
    os.remove(temp_path)


def exportWo():
    url = 'http://tjerp.superboss.cc/wo/search'
    params = {
        'participant': '付家旺',
        'flag': 0,
        'createdStartEnd': f'{int(timestamp(START_DATE) * 1000)},{int(timestamp(END_DATE) * 1000)}',
        'pageSize': 150,
        'pageNo': 1
    }
    cookieStr = '_ati=7646900591401; superuseragent1=4003a5039f0e8f7a5ba7cc0603669c089e9e77724e6c62093d768ecdbefa044b6f28f1cb9f111da020fe442e802bb9dd7db2083301dcb8d1ee8dcd062c830a8cb8bcb576a87cde656d1383b848ef44b2ff76077c26f547d7cc97c77a7dc99f72a79bd5e6c6b68f1a22bea80cb3ff0a84492225a50b50115ba66492cb34832cfbb8c8fa9dbc860788c9aed3977da6e6dc; _tj_validating_staff=461869903041024; lastLoginTime_461869903041024=1752455718000; _tj_censeid=5375af2dedbfd0717b5702d9d32c6db8489f045d; _tj_cookie=461869903041024; _new_tj_censeid=5bdd794acff04b45cc8eade44ce0e949bef8ceed; tfstk=gqpK23Vy3cEK_mvdjHlgqD0HMamiNfxU1e-bEab3NFL9o3bo43_3F3TDq07h-wAOyU_wx_0rYuO98n1hE2BCPLLkq8bQKX57ee8atJmFdkRwonwHKXWue9WPFq0mnxqeYTW78Rxi-yk12iDuF_s5LOiGaansnxxeA6FqYQkDEbOFhNb5F6_7fl_N2WaCAU115g__dgwCFNiO7NaCVg675hsfcW65FU6sXgjlFaT5OcKsseuR5k_ueBd-NdOjZ5ixDdId9aeho8BXk-jllSbae8QKc6_jeNe7FdIp2FthEJMA5BAWKO9I5rW60CYCXtH82Gdvf9spzxyFdnt6N6p-Zo7y6hOc6CrnYGppDLIA1PidzpYpe6JjoR7B6dJRKC0Lna5Wsp52KVwdhI-hKQTsV8_J1gsyxKvYHe4ckgVIXcFza6swnmX1ZqzT9HSOoDH8a75Zb8VpnqP7Nr2dXZmKo7PP_c5..; super_memSessionId1=e88dd273c062e606085f4f4ed83aa74c6904e25a7b7a2e7135c8aabafa7ec5aff73ba90ea0572f7510c35a3463872468d17026fd118a7e0dbad3d0f24ab8c49e; _tj_intercept_login_erp=48430d4d-f50a-4dd8-8001-573e022edb6f; _censeid=cb454ec21aafde296773888ed25fe48aba268e2c; _shatg=6e144526-8a06-4dbb-a401-3885db63697d; JSESSIONID=9D713D9810B3AC29E5EF71CF51161343; ray-authentication=51a9a75993c646e4bae8f6cc23b2c1ba_218.76.8.105_1752844286814_jixing.fjw; SERVERID=b89c9622c26a104b47505ecb2bfa1940|1752844291|1752844277'
    # for cookie in getCookies('erptj.superboss.cc'):
    #     cookieStr += f'{cookie.name}={cookie.value};'
    headers = {
        'cookie': cookieStr
    }
    rsp = requests.request('POST', url, data=params, headers=headers)
    result = []
    for data in rsp.json().get('data', {}).get('content', []):
        content = re.sub('[\s，]+', ',', data.get('description')).strip()
        result.append(f'【{data.get("id")}】{content}')
    return result


def exportTb():
    url = 'https://tb.raycloud.com/api/tasks/others?_userId=612f23fd1f9f03000118a1ae&dueDate__gt={START_DATE}T16%3A00%3A00.000Z&dueDate__lt={END_DATE}T16%3A00%3A00.000Z&isDone=true'
    headers = {
        'cookie': '_ati=7646900591401; superuseragent1=4003a5039f0e8f7a5ba7cc0603669c089e9e77724e6c62093d768ecdbefa044b6f28f1cb9f111da020fe442e802bb9dd7db2083301dcb8d1ee8dcd062c830a8cb8bcb576a87cde656d1383b848ef44b2ff76077c26f547d7cc97c77a7dc99f72a79bd5e6c6b68f1a22bea80cb3ff0a84492225a50b50115ba66492cb34832cfbb8c8fa9dbc860788c9aed3977da6e6dc; _tj_validating_staff=461869903041024; lastLoginTime_461869903041024=1753063954000; _tj_censeid=8d6ef4f0bc47438365b3bee9bdf9420fac28bd7b; _tj_cookie=461869903041024; _tj_intercept_login_erp=0904a809-0e54-410a-87e1-8b748b967d27; _shatg=03f36d30-588c-43c4-8806-ac0362f58e73; _censeid=f08090897f42d8079a697a9fe08c993a9e7141c6; tfstk=gksmVPa-dQGBvpFJygtblGly3NaJynt6p1n96hdazQR5kdK9gaANpO7vBPtv_CRl1idVkOpijtOR6cBA6QfldOefX-6sjfRPZ-TTlinGZnsRkcdYGhXN9hVL9kEdhttXbWFLv4b4tHJm3mltb4uyXdctbTLhhttsF8XZ3q6jIlSGVE-N_3Jyhdtw3Foa48v9nm-wgFlPUdRybh82gukyKKJZ0E5NU8v6aC-wu1-zEdGsmcRhbgszsZ41m6OsYi9DoBW2gOBh4vLZl_RobcSVuIAUXQmZbgvcIhS9ymrHaZQND3S4aXtPdaC2EHqiILbhUnJc1kiX09WP7EjgWvO1rT7praMYhLjcKGvHzbyD1iCcjEsU90OVrgsMDaFmvCTNyiTCD7oDYw6vDN5zQcRGzdSzx4uEMJn6URIr5VT2FLAKvwKtIqLiDq2uE2aXuL9Y9GeozdhIbcgaE80IQEJWHWC..; super_memSessionId1=900d04e283a5a38f753e492ef1cca754bcb1d1e3e90fae8631a191a3bf3fe73bf73ba90ea0572f7510c35a346387246850b60ed7b473f28314afdadf176a9656; ray-authentication=8b620edbdfc7487088f07729258b7383_218.76.8.105_1753591945823_jixing.fjw; JSESSIONID=3DE2F5866932E4C701BE53955DE890CB; ray-authentication=8b620edbdfc7487088f07729258b7383_218.76.8.105_1753591945823_jixing.fjw; _new_tj_censeid=a7bed25b057b3c1a9338fe44cd7d7f722cd537eb'
    }
    rsp = requests.request("GET", url, headers=headers)
    result = []
    for data in rsp.json():
        result.append(data.get('content'))
    return result


W_DICT = {
    0 : '周一',
    1 : '周二',
    2 : '周三',
    3 : '周四',
    4 : '周五',
}
def printWeeklyReport(i, size, wData, tData):
    print('\n### ' + W_DICT.get(i))
    index = 0
    wLen = len(wData)

    for wi in range(wLen):
        if i == (wi % size):
            index += 1
            content = re.sub('.*\n', '', wData[wi])
            print(f'{index}. 【工单】{content}')

    tLen = len(tData)
    for ti in range(tLen):
        if i == (ti % size):
            index += 1
            content = tData[ti]
            print(f'{index}. {content}')    


if __name__ == '__main__':
    # getEdgeCookies()
    wData = []
    # wData = exportWo()
    # i = 0
    # for w in wData:
    #     i += 1
    #     content = re.sub('.*\n', '', w)
    #     if len(content) > 100:
    #         content = content[:100]
    #     print(f"{i}.【工单】{content}")

    tData = exportTb()
    for i in range(DAYS):
        printWeeklyReport(i, DAYS, wData, tData)






