import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useMedicomStore } from '../store';
import { Task } from '../types';

interface TaskRow {
  id: string;
  tenant_id: string;
  title: string;
  is_completed: boolean;
  due_date: string | null;
  priority: 'High' | 'Medium' | 'Low' | null;
  assignee_name: string | null;
}

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    text: row.title,
    completed: row.is_completed,
    dueDate: row.due_date ?? undefined,
    priority: row.priority ?? undefined,
    assignee: row.assignee_name ?? undefined,
  };
}

const MOCK_TASKS_DEFAULT: Task[] = [
  { id: '1', text: 'Appeler Labo Prothèse', completed: false, priority: 'High', assignee: 'Sarah' },
  { id: '2', text: 'Commander Anesthésique', completed: true, priority: 'Medium', assignee: 'Amina' },
  { id: '3', text: 'Relancer facture M. Tazi', completed: false, priority: 'Low', assignee: 'Sarah' },
];

export function useTasks() {
  const { currentTenant } = useMedicomStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!supabase || !currentTenant) {
      setTasks(MOCK_TASKS_DEFAULT);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, tenant_id, title, is_completed, due_date, priority, assignee_name')
        .eq('tenant_id', currentTenant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks((data ?? []).map((r) => toTask(r as TaskRow)));
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setTasks(MOCK_TASKS_DEFAULT);
    } finally {
      setLoading(false);
    }
  }, [currentTenant]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const addTask = useCallback(
    async (text: string, priority: Task['priority'] = 'Medium'): Promise<void> => {
      if (!supabase || !currentTenant) {
        const mockTask: Task = {
          id: `mock-${Date.now()}`,
          text,
          completed: false,
          priority,
        };
        setTasks((prev) => [mockTask, ...prev]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('tasks')
          .insert({ tenant_id: currentTenant.id, title: text, is_completed: false, priority })
          .select()
          .single();

        if (error) throw error;
        setTasks((prev) => [toTask(data as TaskRow), ...prev]);
      } catch (err) {
        console.error('Error adding task:', err);
      }
    },
    [currentTenant]
  );

  const toggleTask = useCallback(
    async (id: string): Promise<void> => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;

      const nextCompleted = !task.completed;
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: nextCompleted } : t)));

      if (!supabase || !currentTenant) return;

      const { error } = await supabase
        .from('tasks')
        .update({ is_completed: nextCompleted })
        .eq('id', id);

      if (error) {
        console.error('Error toggling task:', error);
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: task.completed } : t)));
      }
    },
    [tasks, currentTenant]
  );

  const removeTask = useCallback(
    async (id: string): Promise<void> => {
      setTasks((prev) => prev.filter((t) => t.id !== id));

      if (!supabase || !currentTenant) return;

      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) {
        console.error('Error removing task:', error);
        await fetchTasks();
      }
    },
    [currentTenant, fetchTasks]
  );

  return { tasks, loading, addTask, toggleTask, removeTask };
}
