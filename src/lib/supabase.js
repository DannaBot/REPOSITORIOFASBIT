import { createClient } from '@supabase/supabase-js';

// Mock implementation for localStorage
const createMockClient = () => {
  const getLocalData = () => {
    const data = localStorage.getItem('fasbit_theses');
    return data ? JSON.parse(data) : [];
  };

  const setLocalData = (data) => {
    localStorage.setItem('fasbit_theses', JSON.stringify(data));
  };

  return {
    from: (table) => {
      if (table !== 'theses') return { select: () => ({ data: [], error: null }) };

      return {
        select: (columns) => {
          const data = getLocalData();
          
          const queryBuilder = {
            eq: (field, value) => {
              const filtered = data.filter(item => item[field] === value);
              return { 
                data: filtered, 
                error: null,
                order: () => ({ data: filtered, limit: (n) => ({ data: filtered.slice(0, n) }), single: () => ({ data: filtered[0] || null }) }),
                single: () => ({ data: filtered[0] || null })
              };
            },
            order: (field, { ascending } = { ascending: true }) => {
              const sorted = [...data].sort((a, b) => {
                if (ascending) return a[field] > b[field] ? 1 : -1;
                return a[field] < b[field] ? 1 : -1;
              });
              return { 
                data: sorted, 
                limit: (n) => ({ data: sorted.slice(0, n) }) 
              };
            },
            limit: (n) => ({ data: data.slice(0, n) }),
            single: () => ({ data: data[0] || null }) // naive single
          };
          
          // Return raw data wrapper that also has chainable methods for the initial select
          const result = { 
            data, 
            error: null,
            ...queryBuilder
          };
          return result;
        },
        insert: (rows) => {
          const current = getLocalData();
          // Generamos ID y fecha automáticamente si no vienen
          const newRows = rows.map(r => ({ 
            ...r, 
            id: Date.now() + Math.random(), 
            created_at: new Date().toISOString() 
          }));
          setLocalData([...current, ...newRows]);
          return { data: newRows, error: null };
        },
        update: (updates) => {
          return {
            eq: (field, value) => {
              const current = getLocalData();
              const updated = current.map(item => 
                item[field] == value ? { ...item, ...updates } : item
              );
              setLocalData(updated);
              return { data: updated, error: null };
            }
          };
        }
      };
    }
  };
};

export const supabase = createMockClient();