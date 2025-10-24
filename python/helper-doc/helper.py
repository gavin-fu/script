import json
import requests

DOMAIN = 'https://www.uenjoydental.com'
HEADERS = {
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7,zh-TW;q=0.6',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Content-Type': 'application/json;charset=UTF-8',
    'Origin': 'https://www.uenjoydental.com',
    'Referer': 'https://www.uenjoydental.com/',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0',
    'sec-ch-ua': '"Not)A;Brand";v="8", "Chromium";v="138", "Microsoft Edge";v="138"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3NTY0Nzk0ODQsInVzZXJuYW1lIjoi5YiY6Zuv5amnIn0.9_l0HtlOPZmxLqn4iO3YxoOQHxW93P-ik0llMX5JQf0',
}


def findUsersByScheduling():
    url = DOMAIN + '/medical-manage-web//scheduling/findUsersByScheduling'
    params = '{"userType":"1","date":"2025-08-25 00:10:11","clinicId":"0cdc709140b545958002ce2fe64de3f1"}'
    rsp = requests.request("POST", url, data=params, headers=HEADERS)
    print(rsp.json().get('data', []))


def getAppointmentList(clinicId, dateStr):
    url = DOMAIN + '/medical-manage-web//appointmentRegister/clcRegistration/getAppointmentList?clinicId=' + clinicId +'&subscribeType=1&searchesDateType=2&dateStart=' + dateStr + '+00:00:00&dateEnd=' + dateStr + '+23:59:59&pageNo=1&pageSize=-1'
    rsp = requests.request("GET", url, headers=HEADERS)
    return rsp.json().get('page', {}).get('list')

def getAppointmentUserStatistics(patientId):
    url = DOMAIN + '/medical-manage-web/appointmentRegister/clcRegistration/getAppointmentUserStatistics?patientId=' + patientId
    rsp = requests.request("GET", url, headers=HEADERS)
    return rsp.json().get('data', {})

def saveAppointment(clinicId, appointment, dateStr):
    url = DOMAIN + '/medical-manage-web/appointmentRegister/clcRegistration/saveAppointment'
    params = {
        'clinicId': clinicId,
        'patientId': appointment.get('patientId'),
        'name': appointment.get('name'),
        'subscribeType': appointment.get('subscribeType'),
        'symptomaticType': appointment.get('symptomaticType'),
        'appointmentPeriodBegin': dateStr + ' 09:30',
        'appointmentPeriodEnd': dateStr + ' 09:45',
        'counselor': appointment.get('counselor'),
        'departmentId': appointment.get('departmentId'),
        'doctorId': appointment.get('doctorId'),
        'assistant': appointment.get('assistant'),
        'consultingRoomId': appointment.get('consultingRoomId'),
        'anamnesisNo': 'BF250701100004',
        'clcRegistrationProjectRelIds[0]': 'e42e65e470e74933be8c58de38decffc',
        'clcRegistrationProjectRels[0].projectId': 'e42e65e470e74933be8c58de38decffc',
        'sendMessage': False
    }
    rsp = requests.request("POST", url, params=params, headers=HEADERS)
    print(rsp)


if __name__ == "__main__":
    clinicId = '0cdc709140b545958002ce2fe64de3f1'
    currentDate = '2025-08-27'
    appointmentDate = '2025-11-27'
    appointments = getAppointmentList(clinicId, currentDate)
    for appointment in appointments:
        if appointment.get('doctorName') != '刘雯婧':
            continue
        if appointment.get('patientId') is None:
            continue
        statistics = getAppointmentUserStatistics(appointment.get('patientId'))
        if statistics.get('laterDate') == 0:
            saveAppointment(clinicId, appointment, appointmentDate)