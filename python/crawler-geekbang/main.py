import json
from pathlib import Path
# from selenium import webdriver
from seleniumwire import webdriver
from selenium.webdriver.support.ui import WebDriverWait 
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC 
import time
import requests
import os
import re

ROOT_PATH = '/Users/gavin/Desktop/geekbang/'
SAVE_RECORD_PATH = ROOT_PATH + 'record.log'

HEADERS = {
            "Host": "b.geekbang.org",
            "Origin": "https://b.geekbang.org",
            "Accept": "application/json, text/plain, */*",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Pragma": "no-cache",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0"
        }
USER_INFO = [
    # ('15000020471', 'Ccc3158662'),
    # ('18651714165', 'Zhao2818738!'),
    # ('18674762009', 'a112358'),
    # ('15858170734', 'admin1234'),
    # ('18473753538', 'wenxuan123'),
    # ('15273130402', 'shanguang@ljx'),
    # ('17369427112', '123456ww'),
    # ('18665344664', 'yuyangfan1234'),
    # ('18566700473', 'Ccc3158662'),
    # ('18598906317', '20221227@Ysl'),
    # ('18773611336', 'raycloud123'),
    ('13337334511', 'admin@123'),
    # ('15200900741', 'csgykjyxgs2024'),
    # ('15116181521', 'raycloud1021'),
    # ('15906676332', 'cjzg123456'),
    # ('18506573996', 'maijia123456'),
    # ('15306519961', 'qwe123123'),
    # ('13208032915', 'qwe123123'),
    # ('17858335199', 'qwe293411'),
    # ('18368803862', 'Zgw=123456@'),
    # ('18668037368', 'wang123456'),
    # ('15236700639', 'wzx1234567')
]



# 登录 https://account.geekbang.org/member/signin?gk_notautolg=1
def login(username, password):
    driver = webdriver.Edge()
    driver.get('https://account.geekbang.org/member/signin?gk_notautolg=1')
    
    wait = WebDriverWait(driver, 10)
    loginByPassword = wait.until(EC.presence_of_element_located((By.XPATH, '//span[text()="账号密码登录"]')))
    loginByPassword.click()

    usernameInput = wait.until(EC.presence_of_element_located((By.XPATH, '//input[@placeholder="请输入手机号"]')))
    usernameInput.clear()
    usernameInput.send_keys(username)

    passwordInput = wait.until(EC.presence_of_element_located((By.XPATH, '//input[@placeholder="请输入密码"]')))
    passwordInput.clear()
    passwordInput.send_keys(password)

    agreeCheck = wait.until(EC.presence_of_element_located((By.XPATH, '//span[text()="我已阅读并同意"]')))
    agreeCheck.click()

    loginBtn = wait.until(EC.presence_of_element_located((By.XPATH, '//div[@gk-button and text()="登录"]')))
    loginBtn.click()
    wait.until(EC.presence_of_element_located((By.XPATH, '//div[@gk-button and text()="进入学习中心"]')))

    cookie = None
    for req in  driver.requests:
        for header in req.headers.items():
            if header[0] == 'Cookie' or header[0] == 'cookie':
                HEADERS.update({header[0]: header[1]})
                cookie = header[1]
                break
    print(f'\nGet cookie {cookie}\n')
    driver.quit()


# 读取本地已下载的课程
SAVE_RECORD = {}
def initDownloadRecord():
    if not os.path.exists(SAVE_RECORD_PATH):
        return
    with open(SAVE_RECORD_PATH, 'r', encoding='utf-8') as f:
        for line in f.readlines():
            data = line.split(',')
            courseId = int(data[0]) # 课程ID
            articleId = int(data[1].replace('\n', '')) # 章节ID
            articleIds = SAVE_RECORD.get(courseId, set())
            articleIds.add(articleId)
            SAVE_RECORD.update({courseId: articleIds})


# 下载课程
def downloadCourses():
    courses = listCourses()
    if not courses:
        print(f'用户课程为空.')
        return
    for course in courses:
        print(course.get('title'))
        chapters = listChapters(course.get("sku"))
        for chapter in chapters:
            downloadChapter(course, chapter)

# 获取课程列表
def listCourses():
    url = "https://b.geekbang.org/app/v1/user/center/course"
    params = {"learn_status":0,"expire_status":1,"page":1,"size":10,"order_by":"learn"}
    rsp = request(url, params)
    return rsp.get('list', [])

# 获取课程章节
def listChapters(id):
    url = "https://b.geekbang.org/app/v1/course/articles"
    params = {"id": id}
    return request(url, params).get('list', [])

# 下载课程章节
def downloadChapter(course, chapter):
    print(chapter.get('title'))
    for article in chapter.get("article_list", []):
        articleId = article.get('id')
        if int(articleId) in SAVE_RECORD.get(course.get('id'), set()):
            print('当前文档已下载成功，无需再次下载: ' + article.get('article',{}).get('title') + '(' + articleId + ')')
            continue
        downloadArticle(course, chapter, articleId)

# 下载课程文章
RESOURCE_DIR_NAME = 'resources'
def downloadArticle(course, chapter, articleId):
    data = getArticleData(articleId)
    article = data.get("article")

    # 文章标题
    title = article.get("title").replace('/', '')
    # 文章内容
    content = article.get("content_md")
    # 音频内容地址
    audioUrl = data.get("audio", {}).get("download_url")
    # 视频内容地址
    videoUrl= data.get('video', {}).get('url')

    articleDir = ROOT_PATH + course.get('title') + '/' + chapter.get('title') + '/' + title + '/'
    resourceDir = articleDir + RESOURCE_DIR_NAME
    articleAbsPath = articleDir + title + '.md'
    mkdirs(articleDir)
    mkdirs(resourceDir)
    
    imgs = parseImage(content)
    for img in imgs:
        imgUrl = img[0][1:-1]
        if ' ' in imgUrl:
            imgUrl = imgUrl.split(' ')[0]
        imgType = img[1];
        imgName = imgUrl[imgUrl.rindex('/') + 1 : imgUrl.index(imgType) + len(imgType)]

        downloadResource(resourceDir, imgName, imgUrl)
        content = content.replace(imgUrl, './' + RESOURCE_DIR_NAME + '/' + imgName)
    if audioUrl:
        audioName = audioUrl[audioUrl.rindex('/') + 1:]
        downloadResource(resourceDir, audioName, audioUrl)
        audioUrl = './' + RESOURCE_DIR_NAME + '/' + audioName
    if videoUrl:
        videoName = videoUrl[videoUrl.rindex('/') + 1:]
        downloadResource(resourceDir, videoName, 'https://media001.geekbang.org/' + videoUrl)
        videoUrl = './' + RESOURCE_DIR_NAME + '/' + videoName

    saveArticle(articleAbsPath, title, content, audioUrl, videoUrl)
    writeRecord(course.get('id'), articleId)
    print(title)


# 获取文章内容
def getArticleData(articleId):
    url = "https://b.geekbang.org/app/v1/article/detail"
    params = {"article_id": articleId}
    return request(url, params)

# 获取图片内容
def parseImage(content):
    regex = r"(\(https://static.*?\.(gif|png|jpg|jpeg|webp|svg|psd|bmp|tif).*?\))"
    return re.findall(regex, content)

def downloadResource(dir, name, url):
    rsp = requests.get(url)
    if rsp.status_code == 200:
        if not os.path.exists(dir):
            os.makedirs(dir)
        with open(dir + '/' + name, 'wb') as f:
            f.write(rsp.content)

def saveArticle(path, title, content, audio_url, video_url):
    with open(path, 'w') as f:
        f.write('# ' + title + '\n\n')
        if audio_url:
            f.write('<audio id="audio" controls="" preload="none"><source id="mp3" src="' + audio_url +'"></audio>')
            f.write('\n')
        if video_url:
            f.write('<video width="640" height="480" controls> <source src="' + video_url + '" type="video/mp4"> </video>')
            f.write('\n')
        f.write('\n')
        f.write(content)

def writeRecord(courseId, articleId):
    with open(SAVE_RECORD_PATH, 'a', encoding='utf-8') as f:
        f.write(str(courseId) + ',' + str(articleId) + '\n')


def mkdirs(path):
    if not os.path.exists(path):
        os.makedirs(path)

def request(url, params):
    time.sleep(3)
    rsp = requests.request("POST", url, json = params, headers = HEADERS)
    if rsp.status_code != 200:
        print("-" * 10, "请求失败 url: ", url, ", params: ", params)
        return None
    return rsp.json().get("data", {})


def download(username, password):
    login(username, password)
    initDownloadRecord()
    downloadCourses()



if __name__ == "__main__":
    for user in USER_INFO:
        print(f'\n------> download user {user[0]}\n')
        download(user[0], user[1])
