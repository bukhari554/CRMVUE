<script setup>
import { ref } from 'vue';
import Table from '@/components/Table.vue';

// Sample projects data
const projects = ref([
  {
    id: 1,
    name: 'Spotify',
    logo: '../../assets/img/small-logos/logo-spotify.svg',
    budget: '$2,500',
    status: 'working',
    completion: 60
  },
  {
    id: 2,
    name: 'Invision',
    logo: '../../assets/img/small-logos/logo-invision.svg',
    budget: '$5,000',
    status: 'done',
    completion: 100
  },
  {
    id: 3,
    name: 'Jira',
    logo: '../../assets/img/small-logos/logo-jira.svg',
    budget: '$3,400',
    status: 'canceled',
    completion: 30
  },
  {
    id: 4,
    name: 'Slack',
    logo: '../../assets/img/small-logos/logo-slack.svg',
    budget: '$1,000',
    status: 'canceled',
    completion: 0
  },
  {
    id: 5,
    name: 'Webdev',
    logo: 'https://demos.creative-tim.com/argon-dashboard/assets/img/small-logos/logo-webdev.svg',
    budget: '$14,000',
    status: 'working',
    completion: 80
  },
  {
    id: 6,
    name: 'Adobe XD',
    logo: '../../assets/img/small-logos/logo-xd.svg',
    budget: '$2,300',
    status: 'done',
    completion: 100
  }
]);

const tableColumns = [
  { key: 'name', label: 'Project' },
  { key: 'budget', label: 'Budget' },
  { key: 'status', label: 'Status' },
  { key: 'completion', label: 'Completion' },
  { key: 'actions', label: '' }
];

const getProgressColor = (status) => {
  switch(status) {
    case 'done': return 'bg-gradient-success';
    case 'canceled': return 'bg-gradient-danger';
    case 'working': return 'bg-gradient-info';
    default: return 'bg-gradient-info';
  }
};

const getStatusStyle = (status) => {
  switch(status) {
    case 'done': return { color: '#28a745', textTransform: 'capitalize' };
    case 'canceled': return { color: '#f5365c', textTransform: 'capitalize' };
    case 'working': return { color: '#11cdef', textTransform: 'capitalize' };
    default: return { color: '#11cdef', textTransform: 'capitalize' };
  }
};
</script>

<template>
  <div class="card mb-4">
    <div class="card-header pb-0">
      <h6>Projects table</h6>
    </div>
    <div class="card-body px-0 pt-0 pb-2">
      <Table
        :columns="tableColumns"
        :data="projects"
        min-width="700px"
        card-class="border-0 shadow-none"
      >
        <!-- Project Column -->
        <template #cell-name="{ row }">
          <div class="d-flex px-2 align-items-center">
            <div>
              <img
                :src="row.logo"
                class="avatar avatar-sm rounded-circle me-2"
                :alt="row.name"
              />
            </div>
            <div class="my-auto">
              <h6 class="mb-0 text-sm">{{ row.name }}</h6>
            </div>
          </div>
        </template>

        <!-- Budget Column -->
        <template #cell-budget="{ row }">
          <p class="text-sm font-weight-bold mb-0">{{ row.budget }}</p>
        </template>

        <!-- Status Column -->
        <template #cell-status="{ row }">
          <span class="text-xs font-weight-bold" :style="getStatusStyle(row.status)">{{ row.status }}</span>
        </template>

        <!-- Completion Column -->
        <template #cell-completion="{ row }">
          <div class="d-flex align-items-center justify-content-center">
            <span class="me-2 text-xs font-weight-bold">{{ row.completion }}%</span>
            <div style="width: 80px;">
              <div class="progress">
                <div
                  :class="getProgressColor(row.status)"
                  class="progress-bar"
                  role="progressbar"
                  :aria-valuenow="row.completion"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  :style="{ width: row.completion + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </template>

        <!-- Actions Column -->
        <template #cell-actions="{ row }">
          <button
            class="btn btn-link text-secondary mb-0 p-0"
            aria-haspopup="true"
            aria-expanded="false"
          >
            <i class="fa fa-ellipsis-v text-xs" aria-hidden="true"></i>
          </button>
        </template>
      </Table>
    </div>
  </div>
</template>
