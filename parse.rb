require 'json'

puts "starting"

# FIXME convert this to JS

def start()
	holders = []
	columns = []
	File.open('group-lag-output.txt').each_with_index do |line, i|
		data = Hash.new
		# break early for right now
		if i == 3
			# exit
			break
		end

		tokens = line.split(' ')
		#puts "line=#{i} tokens=#{tokens}"

		if i == 0
			columns = tokens
			next
		end

		puts "-----------"
		tokens.each_with_index do |token, index|
			sanitize_token(token)
	  		data.merge!(columns[index] => token)
		end
		holders << LagHolder.new(:data => data)
	end
	return holders
end

def sanitize_token(token)
	token.strip!
end

class LagHolder
	attr_accessor :data
  def initialize(data)
    self.data = data
  end

  # def to_json
  # 	JSON.generate(self)
  # end
end

holders = start()

# puts "columns => " + columns.to_s
# puts JSON.generate({:someKey => "some value"})
# puts "holders => " + holders.to_s
output = []
holders.each do |h|
	output << JSON.generate(h.data)
end

# puts "holders => " + holders.to_json
puts "output => " + output.to_s

puts "done"

