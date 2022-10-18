<script lang="ts">
	import Modal from '/src/components/Modal.svelte';
	import { onMount } from 'svelte/internal';
	import { get, writable } from 'svelte/store';
	import type { Todo } from '../types';
	import { InputMode } from '../types';
	import FocusModeModal from '/src/components/FocusModeModal.svelte';

	const todos = writable<Todo[]>([]);
	const todosCompleted = writable<Todo[]>([]);
	const todosArchive = writable<Todo[]>([]);

	// Modal / View controls Controls

	let incompleteSelected = true;

	let inputMode = InputMode.TodoCommand;
	var selectedIndex = -1;

	var helpModalShown = false;
	var newTodoModalShown = false;
	var archiveModalShown = false;
	var exportModalShown = false;

	// the following require at least 1 unarchived task
	var editTodoModalShown = false;
	var deleteTodoModalShown = false;
	var focusModeShown = false;

	// shown tasks stuff

	var todoListEl: HTMLElement;
	var completedListEl: HTMLElement;

	var shownLength;

	var firstTaskTitle = '';

	function getFirstTaskTitle(): string {
		if ($todos.length > 0) return $todos[0].title;
		else return '';
	}

	// Values for new todos
	var todoTitleInput = '';

	// Element bindings
	let newTodoTitleInputEl: HTMLElement;
	let editTodoTitleInputEl: HTMLElement;

	// focus the selected index using builtin browser crap.
	// this basically forces the task list frame to scroll when 
	// we're moving the selection out of it
	// $: selectedIndex != null && browser && (() => {
	$: selectedIndex >= 0 && (() => {

		// handle initializing with an invalid selectedIndex because svelte is being a pooper >:c
		if (selectedIndex == -1) {
			selectedIndex = 0;
		}

		let el_id = `${incompleteSelected ? "incomplete-item" : "completed-item"}-${selectedIndex}`
		let el = document.getElementById(el_id)
		if (el) {
			el.setAttribute('tabindex', '0');
			el.focus();
		}
	})();

	onMount(() => {
		// initialize selected index

		if (selectedIndex < 0) {
			selectedIndex = 0
		}

		// Load values

		if (localStorage.getItem('apebrainTodos'))
			todos.set(JSON.parse(localStorage.getItem('apebrainTodos')) ?? []);
		if (localStorage.getItem('apebrainTodosCompleted'))
			todosCompleted.set(JSON.parse(localStorage.getItem('apebrainTodosCompleted')) ?? []);
		if (localStorage.getItem('apebrainTodosArchive'))
			todosArchive.set(JSON.parse(localStorage.getItem('apebrainTodosArchive')) ?? []);

		// Subscribe to state write events

		todos.subscribe((value) => localStorage.setItem('apebrainTodos', JSON.stringify(value)));
		todosCompleted.subscribe((value) =>
			localStorage.setItem('apebrainTodosCompleted', JSON.stringify(value))
		);
		todosArchive.subscribe((value) =>
			localStorage.setItem('apebrainTodosArchive', JSON.stringify(value))
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
						case 'g': {
							// let target = (incompleteSelected ? $todos : $todosCompleted)
							selectedIndex = 0;
							break;
						}
						case ']':
						case 'G': {
							let target = incompleteSelected ? $todos : $todosCompleted;
							selectedIndex = target.length - 1;
							break;
						}
						case ' ': {
							if ((incompleteSelected ? $todos : $todosCompleted).length > 0) {
								let temp = incompleteSelected ? $todos : $todosCompleted;
								let item = temp.splice(selectedIndex, 1)[0];
								if (incompleteSelected) item.checkedDate = new Date();
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
							setTimeout(() => newTodoTitleInputEl.focus(), 0);
							break;
						}
						case 'i':{
							todoTitleInput = $todos[selectedIndex].title;
							editTodoModalShown = true;
							inputMode = InputMode.Insert;
							setTimeout(() => editTodoTitleInputEl.focus(), 0);
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
						case 'f':
							if ($todos.length > 0) {
								firstTaskTitle = getFirstTaskTitle();
								focusModeShown = true;
								inputMode = InputMode.Modal;
							}
							break;
						case 'a':
						case 'A':
						case 't':
						case 'T': {
							if ($todosCompleted.length > 0) {
								archiveModalShown = true;
								inputMode = InputMode.Modal;
							}
							break;
						}
						case 'E':
						case 'e': {
							console.log($todosArchive)
							if ($todosArchive.length > 0) {
								exportModalShown = true;
								inputMode = InputMode.Modal;
							}
							break;
						}
					}
					break;
				}
				case InputMode.Modal: {
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
					if (archiveModalShown) {
						switch (key) {
							case 'a':
							case 'A':
							case 't':
							case 'T':
							case 'Escape': {
								archiveModalShown = false;
								inputMode = InputMode.TodoCommand;
								break;
							}
							case 'Y':
							case 'y': {
								archiveModalShown = false;
								$todosArchive.push(...$todosCompleted.reverse())
								$todosCompleted = [];
								inputMode = InputMode.TodoCommand;
								break;
							}
						}
					}
					if (exportModalShown) {
						switch (key) {
							case 'e':
							case 'E':
							case 'Escape': {
								exportModalShown = false;
								inputMode = InputMode.TodoCommand;
								break;
							}
							case 'Y':
							case 'y': {
								exportModalShown = false;
								let text = JSON.stringify($todosArchive, null, 4);
								download('apebrain_archive.json', text)
								inputMode = InputMode.TodoCommand;
								break;
							}
						}
					}
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
					if (focusModeShown) {
						switch (key) {
							case 'Escape':
							case 'f':
								focusModeShown = false;
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
								incompleteSelected = true;
								selectedIndex = 0;
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


	// source: https://stackoverflow.com/a/18197341
	function download(filename, text) {
		var element = document.createElement('a');
		element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
		element.setAttribute('download', filename);
		element.style.display = 'none';
		document.body.appendChild(element);
		element.click();
		document.body.removeChild(element);
	}

</script>

<!-- Modal popups -->
<Modal bind:shown={deleteTodoModalShown} title="Delete Task? Press [D] to confirm." />
<Modal bind:shown={newTodoModalShown} title="New Task:">
	<div class="w-96 flex flex-col">
		<input
			class="text-xl p-1.5 border-b-2 border-zinc-500 focus:border-zinc-200 bg-transparent outline-0 w-full flex transition ease-in-out duration-200"
			type="text"
			placeholder="Task Title"
			bind:value={todoTitleInput}
			bind:this={newTodoTitleInputEl}
		/>
	</div>
</Modal>

<Modal bind:shown={editTodoModalShown} title="Edit Task">
	<div class="w-96 flex flex-col">
		<input
			class="text-xl p-1.5 border-b-2 border-zinc-500 focus:border-zinc-200 bg-transparent outline-0 w-full flex transition ease-in-out duration-200"
			type="text"
			placeholder="Task Title"
			bind:value={todoTitleInput}
			bind:this={editTodoTitleInputEl}
		/>
	</div>
</Modal>

<Modal bind:shown={helpModalShown} title="Help">
	<div class="flex flex-row text-xl">
		<table class="border-zinc-500 border-collapse">
			<!-- <tr>
				<th class="font-semibold text-left pb-1">Keystroke</th>
				<th class="font-semibold text-left pb-1">Command</th>
			</tr> -->
			<tr><td class="border border-zinc-500 text-zinc-500 px-2.5 py-1">[n / i]</td>         <td class="border border-zinc-500 py-1 px-2.5">add / edit task</td></tr>
			<tr><td class="border border-zinc-500 text-zinc-500 px-2.5 py-1">[h / l]</td>         <td class="border border-zinc-500 py-1 px-2.5">left / right between lists</td></tr>
			<tr><td class="border border-zinc-500 text-zinc-500 px-2.5 py-1">[k / j]</td>         <td class="border border-zinc-500 py-1 px-2.5">up / down between tasks</td></tr>
			<tr><td class="border border-zinc-500 text-zinc-500 px-2.5 py-1">[shift] [k / j]</td> <td class="border border-zinc-500 py-1 px-2.5">move tasks up / down</td></tr>
			<tr><td class="border border-zinc-500 text-zinc-500 px-2.5 py-1">[d]</td>             <td class="border border-zinc-500 py-1 px-2.5">delete task</td></tr>
			<tr><td class="border border-zinc-500 text-zinc-500 px-2.5 py-1">[f]</td>             <td class="border border-zinc-500 py-1 px-2.5">focus mode</td></tr>
			<tr><td class="border border-zinc-500 text-zinc-500 px-2.5 py-1">[space]</td>         <td class="border border-zinc-500 py-1 px-2.5">check / uncheck task</td></tr>
			<tr><td class="border border-zinc-500 text-zinc-500 px-2.5 py-1">[a,t]</td>           <td class="border border-zinc-500 py-1 px-2.5">archive cleared tasks</td></tr>
			<tr><td class="border border-zinc-500 text-zinc-500 px-2.5 py-1">[e]</td>             <td class="border border-zinc-500 py-1 px-2.5">export archived tasks</td></tr>
			<tr><td class="border border-zinc-500 text-zinc-500 px-2.5 py-1">[esc]</td>           <td class="border border-zinc-500 py-1 px-2.5">exit current view</td></tr>
			<tr><td class="border border-zinc-500 text-zinc-500 px-2.5 py-1">[/,?]</td>           <td class="border border-zinc-500 py-1 px-2.5">help</td></tr>
		</table>
	</div>
</Modal>

<Modal bind:shown={archiveModalShown} title="Would you like to archive all tasks? [Y] to confirm."/>

<Modal bind:shown={exportModalShown} title="Would you like to export all archived tasks? [Y] to confirm."/>

<FocusModeModal bind:shown={focusModeShown}>
	<div class="text-3xl">{firstTaskTitle}</div>
</FocusModeModal>

<!-- Incomplete todos -->
<div id="task-column" class="py-4 w-auto flex flex-col lhalf">
	<div class="flex flex-row items-center pr-16 pl-8">
		<div class="text-2xl select-none mb-2.5 pb-0 hidden lg:flex">{"[ apebrain.xyz ]"}</div>
		<div class="ml-auto text-3xl font-bold pb-3 background-zinc-900">Tasks</div>
	</div>
	<div class="incomplete-container relative scrollbar scrollbar-track-zinc-900 scrollbar-thumb-zinc-200" bind:this="{todoListEl}">
	{#each $todos as todo, i}
	<div class="pl-16 pr-8">
		<div
		id="incomplete-item-{i}"
		class="flex flex-row my-1.5 px-2.5 h-10 w-full items-center rounded-md transition ease-in-out duration-200 select-none 
		{incompleteSelected && get(todos)[selectedIndex] === todo
			? 'bg-zinc-200 text-zinc-900 scale-105'
			: ''}">
			<div class="mr-3">
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-circle stroke-zinc-{incompleteSelected && get(todos)[selectedIndex] === todo ? '900' : '200'}"><circle cx="12" cy="12" r="10" /></svg >
			</div>
			<!-- <div class="flex text-xl text-ellipsis overflow-hidden">{todo.title} - {i}</div> -->
			<div class="flex text-xl text-ellipsis overflow-hidden whitespace-nowrap">{todo.title}</div>
		</div>
	</div>
		{/each}
	</div>
</div>

<!-- Completed todos -->
<div id="completed-column" class="py-4 w-auto flex flex-col text-zinc-500 rhalf">
	<div class="flex flex-row items-center pl-8 pr-16">
		<div class="text-3xl font-bold pb-3 background-zinc-900">Completed</div>
		<a 
		class="ml-auto text-2xl text-zinc-100 select-none mb-2.5 pb-0 hidden lg:flex cursor-pointer hover:bg-zinc-100 hover:text-zinc-900"
		href="https://github.com/Cuties-Inc/apebrain.xyz"
		target="_blank"
		>{"[ github ]"}
		</a>
	</div>
	<div class="completed-container relative pr-16 scrollbar scrollbar-track-zinc-900 scrollbar-thumb-zinc-700" bind:this={completedListEl}>
		{#each $todosCompleted as todo, i}
		<div class="pl-8">
			<div
			id="completed-item-{i}"
			class="flex flex-row my-1.5 px-2.5 h-10 w-full items-center rounded-md w-fit {!incompleteSelected &&
			$todosCompleted[selectedIndex] === todo
				? 'bg-zinc-400 text-zinc-900 scale-105'
				: ''} transition ease-in-out duration-200 select-none"
			>
				<div class="mr-3">
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-check-circle stroke-zinc-{!incompleteSelected && $todosCompleted[selectedIndex] === todo ? '900' : '400'}" ><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg
					>
				</div>
				<div class="flex text-xl text-ellipsis overflow-hidden whitespace-nowrap mr-2 line-through">{todo.title}</div>
				{#if todo.checkedDate}
					<div class="flex ml-auto text-xl">
						{new Date(todo.checkedDate).getMonth() + 1}/{new Date(
							todo.checkedDate
						).getDate()}/{new Date(todo.checkedDate).getFullYear()}
					</div>
				{/if}
			</div>
		</div>
		{/each}
	</div>
</div>

{#if $todos.length == 0 && $todosCompleted.length == 0 && !helpModalShown && !newTodoModalShown && !archiveModalShown && !exportModalShown}
<div class="absolute z-30 w-screen h-screen flex pointer-events-none">
	<div class="flex m-auto text-2xl text-zinc-500 bg-zinc-900 select-none">Press the "/" key for help</div>
</div>
{/if}

<style>
	.lhalf {
		width: calc(100vw / 2);
		left: 0;
	}

	.rhalf {
		width: calc(100vw / 2);
		left: calc(100vw / 2);
	}

	.incomplete-container {
		overflow-y: scroll;

		max-width: 100% !important;
		width: 100%;
		overflow-x: visible !important;

		/* padding: 0px 20px; */
	}

	.completed-container {
		overflow-y: scroll;

		max-width: 100% !important;
		width: 100%;
		overflow-x: visible !important;

		/* padding: 0px 20px; */
	}

	*:focus {
		outline: none;
	}
</style>
