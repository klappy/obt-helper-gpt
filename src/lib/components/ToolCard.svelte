<script>
	export let tool;
</script>

<div class="card group cursor-pointer transform hover:scale-105 transition-all duration-200">
	<div class="flex items-start space-x-4">
		<div class="text-4xl">{tool.icon}</div>
		<div class="flex-1">
			<h3 class="text-lg font-semibold text-gray-900 group-hover:text-primary-600">
				{tool.name}
			</h3>
			<p class="text-gray-600 mt-1 text-sm">
				{tool.description}
			</p>
			<div class="mt-4 flex items-center justify-between">
				<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
					{tool.model}
				</span>
				<button class="btn-primary text-sm">
					Start Chat
				</button>
			</div>
		</div>
	</div>
</div> 