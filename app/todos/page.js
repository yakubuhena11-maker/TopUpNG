"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "topupng-todos";

function createTodo(title) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: title.trim(),
    completed: false,
    createdAt: new Date().toISOString(),
  };
}

export default function TodosPage() {
  const [todos, setTodos] = useState([]);
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setTodos(JSON.parse(saved));
    } catch {
      // Ignore invalid or unavailable local storage data.
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos, ready]);

  function addTodo(event) {
    event.preventDefault();
    if (!draft.trim()) return;
    setTodos((current) => [createTodo(draft), ...current]);
    setDraft("");
  }

  function toggleTodo(id) {
    setTodos((current) => current.map((todo) => (
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    )));
  }

  function deleteTodo(id) {
    setTodos((current) => current.filter((todo) => todo.id !== id));
    if (editingId === id) cancelEditing();
  }

  function startEditing(todo) {
    setEditingId(todo.id);
    setEditingTitle(todo.title);
  }

  function saveEdit(event, id) {
    event.preventDefault();
    if (!editingTitle.trim()) return;
    setTodos((current) => current.map((todo) => (
      todo.id === id ? { ...todo, title: editingTitle.trim() } : todo
    )));
    cancelEditing();
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingTitle("");
  }

  const visibleTodos = useMemo(() => todos.filter((todo) => {
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  }), [todos, filter]);

  const remaining = todos.filter((todo) => !todo.completed).length;
  const completed = todos.length - remaining;

  return (
    <main className="todo-page">
      <div className="todo-shell">
        <header className="todo-header">
          <div>
            <div className="wordmark">top<span>up</span>ng</div>
            <p className="todo-kicker">Personal workspace</p>
            <h1>My tasks</h1>
            <p className="sub">Keep your day moving, one task at a time.</p>
          </div>
          <div className="todo-count"><strong>{remaining}</strong><span>open</span></div>
        </header>

        <form className="todo-composer" onSubmit={addTodo}>
          <input
            aria-label="New task"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="What needs to be done?"
            maxLength={160}
          />
          <button className="btn" type="submit" disabled={!draft.trim()}>Add task</button>
        </form>

        <div className="todo-toolbar">
          <div className="todo-filters" role="tablist" aria-label="Task filters">
            {["all", "active", "completed"].map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={filter === item}
                className={filter === item ? "active" : ""}
                onClick={() => setFilter(item)}
              >
                {item[0].toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>
          {completed > 0 && (
            <button className="todo-clear" type="button" onClick={() => setTodos((current) => current.filter((todo) => !todo.completed))}>
              Clear completed
            </button>
          )}
        </div>

        <section className="todo-list" aria-live="polite">
          {!ready && <div className="todo-empty"><span className="todo-empty-icon">…</span><p>Loading your tasks…</p></div>}
          {ready && visibleTodos.length === 0 && (
            <div className="todo-empty">
              <span className="todo-empty-icon">✓</span>
              <strong>{filter === "completed" ? "No completed tasks" : "You’re all caught up"}</strong>
              <p>{filter === "completed" ? "Finished tasks will appear here." : "Add a task above to get started."}</p>
            </div>
          )}
          {visibleTodos.map((todo) => (
            <article className={`todo-item ${todo.completed ? "is-complete" : ""}`} key={todo.id}>
              <button className="todo-check" type="button" onClick={() => toggleTodo(todo.id)} aria-label={todo.completed ? "Mark task active" : "Mark task complete"}>
                {todo.completed ? "✓" : ""}
              </button>
              {editingId === todo.id ? (
                <form className="todo-edit" onSubmit={(event) => saveEdit(event, todo.id)}>
                  <input autoFocus value={editingTitle} onChange={(event) => setEditingTitle(event.target.value)} maxLength={160} />
                  <button type="submit" aria-label="Save task">Save</button>
                  <button type="button" onClick={cancelEditing} aria-label="Cancel editing">Cancel</button>
                </form>
              ) : (
                <button className="todo-title" type="button" onClick={() => startEditing(todo)}>{todo.title}</button>
              )}
              {editingId !== todo.id && <button className="todo-delete" type="button" onClick={() => deleteTodo(todo.id)} aria-label={`Delete ${todo.title}`}>×</button>}
            </article>
          ))}
        </section>

        <footer className="todo-footer">
          <span>{todos.length} {todos.length === 1 ? "task" : "tasks"} total</span>
          <span>Saved on this device</span>
        </footer>
      </div>
    </main>
  );
}
