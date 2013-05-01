require 'redis'

# 建立到默认地址和端口的Redis的连接
redis = Redis.new

redis.del('autocomplete')

# 获得标签的所有前缀
#
# @example
#    get_prefixes('word')
#      # => ['w', 'wo', 'wor', 'word*']
def get_prefixes(word)
  Array.new(word.length) do |i|
    if i == word.length - 1
      "#{word}*"
    else
      word[0..i]
    end
  end
end

argv = []
File.open('words.txt').each_line do |word|
   get_prefixes(word.chomp).each do |prefix|
     argv << [0, prefix]
   end
end
redis.zadd('autocomplete', argv)

while prefix = gets.chomp do
   result = []
   if (rank = redis.zrank('autocomplete', prefix))
     # 存在以用户输入的内容为前缀的标签
     redis.zrange('autocomplete', rank + 1, rank + 100).each do |words|
        # 获得该前缀后的100个元素
        if words[-1] == '*' && prefix == words[0..prefix.length - 1]
          # 如果以"*"结尾并以用户输入的内容为前缀则加入结果中
          result << words[0..-2]
        end
     end
   end
   # 打印结果
   puts result
end
