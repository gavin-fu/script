import requests


class Sandbox(object):

    def __init__(self):
        self.heads = {
            'accept': '*/*',
            'accept-encoding' : 'gzip, deflate',
            'accept-language' : 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
            'connection' : 'keep-alive',
            'content-type' : 'application/x-www-form-urlencoded; charset=UTF-8',
            'host' : 'sandbox.erp.superboss.cc',
            'origin' : 'http: //sandbox.erp.superboss.cc',
            'referer' : 'http: //sandbox.erp.superboss.cc/login',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
            'x-requested-with': 'XMLHttpRequest'
        }


    def login(self):
        url = 'http://sandbox.erp.superboss.cc/login'
        params = {'username': 'admin@raycloud.com', 'password': 'kmerp123'}
        rsp = requests.post(url, data=params, headers=self.heads)
        if rsp.status_code != 200:
            raise Exception('登录失败')
        token = ";".join([f"{k}={v}" for k, v in rsp.cookies.get_dict().items()])
        self.heads.update({'cookie': token})


    def create_trade(self, trade_json=None):
        url = 'http://sandbox.erp.superboss.cc/console/trade/save'
        params = trade_json;
        if not params:
            params = '{' + \
                        '"userId": 354582116864,' + \
                        '"status": "PAID",' + \
                        '"discountValue": "0",' + \
                        '"payment": "20",' + \
                        '"content": "{\n  \"type\": \"fixed\",\n  \"post_fee\": \"0.00\",\n  \"shipping_type\": \"free\",\n  \"receiver_name\": \"刘明剑yYNDg\",\n  \"receiver_state\": \"浙江省\",\n  \"receiver_city\": \"杭州市\",\n  \"receiver_district\": \"滨江区\",\n  \"receiver_town\": \"长河街道\",\n  \"receiver_address\": \"江南大道588号恒鑫大厦10F光云科技\",\n  \"receiver_mobile\": \"13777366666\",\n  \"receiver_phone\": \"\",\n  \"receiver_zip\": \"223700\",\n  \"promotion_details\": [],\n  \"invoice_kind\": \"1\",\n  \"invoice_name\": \"杭州光云科技股份有限公司\",\n  \"invoice_type\": \"办公用品\",\n  \"buyer_nick\": \"usiboy\",\n  \"buyer_message\": \"发顺丰\",\n  \"seller_memo\": \"\",\n  \"seller_flag\": 2\n}",' + \
                        '"orders": [' + \
                            '{' + \
                            '"oid": 1733391183073,' + \
                            '"itemId": "627467391277568",' + \
                            '"skuId": null,' + \
                            '"title": "纯商品-1",' + \
                            '"num": "1",' + \
                            '"price": "10",' + \
                            '"payment": "10.00",' + \
                            '"content": "{\n\t\"cid\": 123456\n}",' + \
                            '"outerId": "pure-item-1",' + \
                            '"refundStatus": "",' + \
                            '"subStock": "1",' + \
                            '"propertiesName": "",' + \
                            '"skuOuterId": "",' + \
                            '"discountValue": "0.00"' + \
                            '},' + \
                            '{' + \
                            '"oid": 1733391188848,' + \
                            '"itemId": "627467710794240",' + \
                            '"skuId": null,' + \
                            '"title": "纯商品-2",' + \
                            '"num": "1",' + \
                            '"price": "10.00",' + \
                            '"payment": "10.00",' + \
                            '"content": "{\n\t\"cid\": 123456\n}",' + \
                            '"outerId": "pure-item-2",' + \
                            '"refundStatus": "",' + \
                            '"subStock": "0",' + \
                            '"propertiesName": "",' + \
                            '"skuOuterId": "",' + \
                            '"discountValue": "0.00"' + \
                            '}' + \
                        '],' + \
                        '"consignTime": "",' + \
                        '"created": "",' + \
                        '"finishedTime": "",' + \
                        '"payTime": ""' + \
                        '}'
        rsp = requests.post(url, json=params, headers=self.heads)
        print(rsp)
        


if __name__ == '__main__':
    sandbox = Sandbox()
    sandbox.login()
    sandbox.create_trade()