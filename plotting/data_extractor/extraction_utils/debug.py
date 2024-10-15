class Debug(object):
	"""docstring for Debug"""
	def __init__(self, isOn):
		super(Debug, self).__init__()
		self.isOn = isOn

	def log(self, message):
		if(self.isOn):
			print(message)