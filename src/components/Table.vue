<script setup>
import { computed } from 'vue';

const props = defineProps({
  columns: {
    type: Array,
    required: true,
    validator: (value) => {
      return Array.isArray(value) && value.every(col => col.key && col.label);
    }
  },
  data: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  loadingText: {
    type: String,
    default: 'Loading...'
  },
  emptyText: {
    type: String,
    default: 'No data found.'
  },
  // Pagination props
  pagination: {
    type: Object,
    default: null
  },
  // Table styling
  minWidth: {
    type: String,
    default: '800px'
  },
  cardClass: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['page-change']);

const handlePageChange = (page) => {
  emit('page-change', page);
};

const colspan = computed(() => props.columns.length);
</script>

<template>
  <div :class="['card border table-card', cardClass]">
    <div class="table-responsive">
      <table class="table table-hover mb-0">
        <thead class="table-light">
          <tr>
            <th v-for="column in columns" :key="column.key">
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td :colspan="colspan" class="text-center py-5">
              <i class="fas fa-spinner fa-spin me-2"></i>
              {{ loadingText }}
            </td>
          </tr>
          <tr v-else-if="data.length === 0">
            <td :colspan="colspan" class="text-center py-5 text-muted">
              {{ emptyText }}
            </td>
          </tr>
          <tr v-else v-for="(row, rowIndex) in data" :key="rowIndex">
            <td v-for="column in columns" :key="column.key">
              <slot 
                :name="`cell-${column.key}`" 
                :row="row" 
                :value="row[column.key]"
                :column="column"
              >
                {{ row[column.key] || '—' }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="pagination && pagination.lastPage > 1" class="card-footer d-flex justify-content-between align-items-center">
      <div class="text-muted small">
        Showing {{ (pagination.currentPage - 1) * pagination.perPage + 1 }} to 
        {{ Math.min(pagination.currentPage * pagination.perPage, pagination.total) }} of 
        {{ pagination.total }} {{ pagination.itemName || 'items' }}
      </div>
      <div>
        <button
          class="btn btn-sm btn-outline-secondary me-2"
          :disabled="pagination.currentPage === 1"
          @click="handlePageChange(pagination.currentPage - 1)"
        >
          <i class="fas fa-chevron-left"></i> Previous
        </button>
        <button
          class="btn btn-sm btn-outline-secondary"
          :disabled="pagination.currentPage === pagination.lastPage"
          @click="handlePageChange(pagination.currentPage + 1)"
        >
          Next <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.table-card {
  overflow: hidden;
}
.table-card .table-responsive {
  overflow-x: auto !important;
  overflow-y: visible;
  -webkit-overflow-scrolling: touch;
  width: 100%;
}
.table-card .table {
  min-width: v-bind(minWidth);
  width: 100%;
}
.table-card .table-responsive::-webkit-scrollbar {
  height: 8px;
}
.table-card .table-responsive::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}
.table-card .table-responsive::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}
.table-card .table-responsive::-webkit-scrollbar-thumb:hover {
  background: #555;
}
.table th {
  white-space: nowrap;
  font-weight: 600;
  font-size: 0.875rem;
}
.table thead:first-child tr:first-child th:first-child {
  border-top-left-radius: 1rem;
}
.table thead:first-child tr:first-child th:last-child {
  border-top-right-radius: 1rem;
}
.table td {
  font-size: 0.875rem;
  vertical-align: middle;
}
</style>

