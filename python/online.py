# -*- coding: utf-8 -*-
import web
import time
import redis

r = redis.StrictRedis()

""" 配置路由规则
'/':       模拟用户的访问
'/online': 查看在线用户
"""
urls = (
    '/', 'visit',
    '/online', 'online'
)
app = web.application(urls, globals())

""" 返回当前时间对应的键名
如28分对于的键名是active.user:28
"""
def time_to_key(current_time):
    return 'active.user:' + time.strftime('%M', time.localtime(current_time))

""" 返回最近10分钟的键名
结果是列表类型
"""
def keys_in_last_10_minutes():
    result = []
    for i in range(10):
        result.append(time_to_key(time.time() - i * 60))
    return result

class visit:
    """ 模拟用户访问
    将用户的User agent作为用户的ID加入到当前时间对应的键中
    """
    def GET(self):
        user_id = web.ctx.env['HTTP_USER_AGENT']
        current_key = time_to_key(time.time())
        pipe = r.pipeline()
        pipe.sadd(current_key, user_id)
        # 设置键的有效期为10分钟
        pipe.expire(current_key, 10 * 60)
        pipe.execute()

        return 'User:\t' + user_id + '\r\nKey:\t' + current_key

class online:
    """ 查看当前在线的用户列表
    """
    def GET(self):
        online_users = r.sunion(keys_in_last_10_minutes())
        result = ''
        for user in online_users:
          result += 'User agent:' + user + '\r\n'
        return result


if __name__ == "__main__":
    app.run()

