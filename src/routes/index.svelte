<script lang="ts">
	import Modal from '/src/components/Modal.svelte';
	import { onMount } from 'svelte/internal';
	import { get, writable } from 'svelte/store';
	import type { Todo } from '../types';
	import { InputMode } from '../types';

	const todos = writable<Todo[]>([]);
	const todosCompleted = writable<Todo[]>([]);

	// Modal / View controls Controls

	let incompleteSelected = true;

	let inputMode = InputMode.TodoCommand;
	var selectedIndex = 0;

  var helpModalShown = false;
	var newTodoModalShown = false;
	var editTodoModalShown = false;
	var deleteTodoModalShown = false;

	// Values for new todos
	var todoTitleInput = '';
	// var newTodoDue = new Date()

	// Element bindings
	let newTodoTitleInputEl;

	onMount(() => {
		// Load values

		console.log(`Load Todos: ${localStorage.getItem('apebrainTodos')}`);

		if (localStorage.getItem('apebrainTodos'))
			todos.set(JSON.parse(localStorage.getItem('apebrainTodos')) ?? []);
		if (localStorage.getItem('apebrainTodosCompleted'))
			todosCompleted.set(JSON.parse(localStorage.getItem('apebrainTodosCompleted')) ?? []);

		// Subscribe to state write events

		todos.subscribe((value) => localStorage.setItem('apebrainTodos', JSON.stringify(value)));
		todosCompleted.subscribe((value) =>
			localStorage.setItem('apebrainTodosCompleted', JSON.stringify(value))
		);

		// Handle key events / register keybindings

		document.addEventListener('keydown', (event) => {
			const key = event.key;
			switch (inputMode) {
				case InputMode.TodoCommand: {
					switch (key) {
						case 'l':
							if ($todosCompleted.length > 0) {
								selectedIndex = 0;
								incompleteSelected = false;
							}
							break;
						case 'h':
							if (!incompleteSelected) {
								selectedIndex = 0;
								incompleteSelected = true;
							}
							break;
						case 'k': {
							if (get(incompleteSelected ? todos : todosCompleted).length > 0 && selectedIndex > 0)
								selectedIndex--;
							break;
						}
						case 'j': {
							if (
								get(incompleteSelected ? todos : todosCompleted).length > 0 &&
								selectedIndex < get(incompleteSelected ? todos : todosCompleted).length - 1
							)
								selectedIndex++;
							break;
						}
						case 'K': {
							if (incompleteSelected && get(todos).length > 0 && selectedIndex > 0) {
								let arr = get(todos);
								let temp = arr[selectedIndex];
								arr.splice(selectedIndex, 1);
								arr.splice(selectedIndex - 1, 0, temp);
								todos.set(arr);
								selectedIndex--;
							}
							break;
						}
						case 'J': {
							if (
								incompleteSelected &&
								get(todos).length > 0 &&
								selectedIndex < get(todos).length - 1
							) {
								let arr = get(todos);
								let temp = arr[selectedIndex];
								arr.splice(selectedIndex, 1);
								arr.splice(selectedIndex + 1, 0, temp);
								todos.set(arr);
								selectedIndex++;
							}
							break;
						}
						case '[':
						case 'g':
							selectedIndex = 0;
							break;
						case ']':
						case 'G':
							selectedIndex = $todos.length - 1;
							break;
						case ' ': {
							if ((incompleteSelected ? $todos : $todosCompleted).length > 0) {
								let temp = incompleteSelected ? $todos : $todosCompleted;
								let item = temp.splice(selectedIndex, 1)[0];
								if (!incompleteSelected) item.checkedDate = new Date();
								(incompleteSelected ? todos : todosCompleted).set(temp);
								temp = incompleteSelected ? $todosCompleted : $todos;
								temp.unshift(item);
								(incompleteSelected ? todosCompleted : todos).set(temp);
								if (!incompleteSelected) incompleteSelected = true;
								selectedIndex = 0;
								// if (selectedIndex == temp.length && selectedIndex > 0) selectedIndex--;
							}
							break;
						}
						case 'd': {
							if (incompleteSelected && $todos.length > 0) {
								deleteTodoModalShown = true;
								inputMode = InputMode.Modal;
							}
							break;
						}
						case 'n': 
            case 'N':
            case 'o':
            case 'O': {
							todoTitleInput = '';
							newTodoModalShown = true;
							inputMode = InputMode.Insert;
							newTodoTitleInputEl.focus();
							break;
						}
						case 'i':
						case 'e': {
							todoTitleInput = $todos[selectedIndex].title;
							editTodoModalShown = true;
							inputMode = InputMode.Insert;
							newTodoTitleInputEl.focus();
							break;
						}
						case '1':
						case '2':
						case '3':
						case '4':
						case '5':
						case '6':
						case '7':
						case '8':
						case '9': {
							let n = Number(key);
							selectedIndex = $todos.length > n ? n - 1 : $todos.length - 1;
              break;
						}
            case '/':
            case '?':
              helpModalShown = true;
              inputMode = InputMode.Modal;
              break;
					}
					break;
				}
				case InputMode.Modal: {
					if (deleteTodoModalShown) {
						switch (key) {
							case 'd': {
								let temp = get(todos);
								temp.splice(selectedIndex, 1);
								todos.set(temp);
								deleteTodoModalShown = false;
								if (selectedIndex == temp.length && selectedIndex > 0) selectedIndex--;
								inputMode = InputMode.TodoCommand;
								break;
							}
							case 'n':
							case 'N':
							case 'Escape': {
								deleteTodoModalShown = false;
								inputMode = InputMode.TodoCommand;
								break;
							}
						}
					}
          if (helpModalShown) {
            switch (key) {
              case 'Escape':
              case '/':
              case '?':
                helpModalShown = false;
                inputMode = InputMode.TodoCommand;
                break;
            }
          }
					break;
				}
				case InputMode.Insert: {
					if (newTodoModalShown) {
						switch (key) {
							case 'Escape':
								newTodoModalShown = false;
								inputMode = InputMode.TodoCommand;
								break;
							case 'Enter':
								let t: Todo = {
									title: todoTitleInput
								};
								let a = get(todos);
								a.unshift(t);
								todos.set(a);
								// reset newTodo state
								newTodoModalShown = false;
								inputMode = InputMode.TodoCommand;
								todoTitleInput = '';
								break;
						}
					}
					if (editTodoModalShown) {
						switch (key) {
							case 'Escape':
								editTodoModalShown = false;
								inputMode = InputMode.TodoCommand;
								break;
							case 'Enter':
								let t: Todo = {
									title: todoTitleInput
								};
								let a = get(todos);
								a[selectedIndex] = t;
								todos.set(a);
								// reset newTodo state
								editTodoModalShown = false;
								inputMode = InputMode.TodoCommand;
								todoTitleInput = '';
								break;
						}
					}
				}
			}
		});
	});
</script>

<Modal shown={deleteTodoModalShown} title="Delete Task? Press [D] to confirm." />
<Modal shown={newTodoModalShown} title="New Task:">
	<div class="w-96 flex flex-col">
		<input
			class="text-2xl p-1.5 border-b-2 border-zinc-500 focus:border-zinc-200 bg-transparent outline-0 w-full flex transition ease-in-out duration-200"
			type="text"
			placeholder="Task Title"
			bind:value={todoTitleInput}
			bind:this={newTodoTitleInputEl}
		/>
	</div>
</Modal>
<Modal shown={editTodoModalShown} title="Edit Task">
	<div class="w-96 flex flex-col">
		<input
			class="text-2xl p-1.5 border-b-2 border-zinc-500 focus:border-zinc-200 bg-transparent outline-0 w-full flex transition ease-in-out duration-200"
			type="text"
			placeholder="Task Title"
			bind:value={todoTitleInput}
		/>
	</div>
</Modal>
<Modal shown={helpModalShown} title="Help">
	<div class="w-96 flex flex-row text-xl">
    <div class="flex flex-col">
      <div>[n / i] - add new task</div>
      <div>[h / l] - left/right between lists</div>
      <div>[k / j] - up/down between tasks</div>
      <div>[d] - delete task</div>
      <div>[space] - check/uncheck task</div>
      <div>[esc] - exit current view</div>
      <div>[/ / ?] - help</div>
    </div>
  </div> 
</Modal>

<div class="py-4 pl-8 pr-16 w-auto flex flex-col lhalf">
	<div class="text-3xl font-bold">Tasks</div>
	<div class="h-3" />
	{#each $todos as todo}
		<div
			class="flex flex-row my-1.5 px-2.5 py-1.5 w-full items-center rounded-md {incompleteSelected &&
			get(todos)[selectedIndex] === todo
				? 'bg-zinc-200 text-zinc-900 scale-110 translate-x-4'
				: ''} transition ease-in-out duration-200 select-none"
		>
			<div class="mr-3">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="feather feather-circle stroke-zinc-{incompleteSelected &&
					get(todos)[selectedIndex] === todo
						? '900'
						: '200'}"><circle cx="12" cy="12" r="10" /></svg
				>
			</div>
			<div class="flex text-2xl text-ellipsis overflow-hidden">{todo.title}</div>
		</div>
	{/each}
</div>
<div class="py-4 pl-8 pr-16 w-auto flex flex-col text-zinc-400 rhalf">
	<div class="text-3xl font-bold">Completed</div>
	<div class="h-3" />
	{#each $todosCompleted as todo}
		<div
			class="flex flex-row my-1.5 px-2.5 py-1.5 w-full items-center rounded-md {!incompleteSelected &&
			$todosCompleted[selectedIndex] === todo
				? 'bg-zinc-400 text-zinc-900 scale-110 translate-x-4'
				: ''} transition ease-in-out duration-200 select-none"
		>
			<div class="mr-3">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="feather feather-check-circle stroke-zinc-{!incompleteSelected &&
					$todosCompleted[selectedIndex] === todo
						? '900'
						: '400'}"
					><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline
						points="22 4 12 14.01 9 11.01"
					/></svg
				>
			</div>
			<div class="flex text-2xl text-ellipsis overflow-hidden line-through">{todo.title}</div>
		</div>
	{/each}
</div>

<style>
	.lhalf {
		width: calc(100vw / 2);
		left: 0;
	}
	.rhalf {
		width: calc(100vw / 2);
		left: calc(100vw / 2);
	}
</style>
