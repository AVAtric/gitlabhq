import _ from 'underscore';
import PrometheusMetrics from '~/prometheus_metrics/prometheus_metrics';
import PANEL_STATE from '~/prometheus_metrics/constants';
import axios from '~/lib/utils/axios_utils';
import { s__ } from '~/locale';
import { capitalizeFirstCharacter } from '~/lib/utils/text_utility';

function customMetricTemplate(metric) {
  return `
      <li class="custom-metric">
        <a href="${metric.edit_path}">
          ${metric.group} / ${metric.title}
        </a>
      </li>
    `;
}

export default class EEPrometheusMetrics extends PrometheusMetrics {
  constructor(wrapperSelector) {
    super(wrapperSelector);

    this.$wrapperCustomMetrics = $(wrapperSelector);
    this.$monitoredCustomMetricsPanel = this.$wrapperCustomMetrics.find('.js-panel-custom-monitored-metrics');
    this.$monitoredCustomMetricsCount = this.$monitoredCustomMetricsPanel.find('.js-custom-monitored-count');
    this.$monitoredCustomMetricsLoading = this.$monitoredCustomMetricsPanel.find('.js-loading-custom-metrics');
    this.$monitoredCustomMetricsEmpty = this.$monitoredCustomMetricsPanel.find('.js-empty-custom-metrics');
    this.$monitoredCustomMetricsList = this.$monitoredCustomMetricsPanel.find('.js-custom-metrics-list');
    this.$newCustomMetricButton = this.$monitoredCustomMetricsPanel.find('.js-new-metric-button');
    this.$flashCustomMetricsContainer = this.$wrapperCustomMetrics.find('.flash-container');
    this.customMetrics = [];
    this.environmentsData = [];

    this.activeCustomMetricsEndpoint = this.$monitoredCustomMetricsPanel.data('active-custom-metrics');
    this.environmentsDataEndpoint = this.$monitoredCustomMetricsPanel.data('environments-data-endpoint');
    this.customMetricsEndpoint = this.activeCustomMetricsEndpoint.replace('.json', '/');
  }

  deleteMetricEndpoint(id) {
    return `${this.customMetricsEndpoint}${id}`;
  }

  deleteMetric(currentTarget) {
    const targetId = currentTarget.dataset.metricId;
    axios.delete(this.deleteMetricEndpoint(targetId))
      .then(() => {
        currentTarget.parentElement.parentElement.remove();
        const elementToFind = { id: parseInt(targetId, 10) };
        const indexToDelete = _.findLastIndex(this.customMetrics, elementToFind);
        this.customMetrics.splice(indexToDelete, 1);
        this.$monitoredCustomMetricsCount.text(this.customMetrics.length);
        if (this.customMetrics.length === 0) {
          this.showMonitoringCustomMetricsPanelState(PANEL_STATE.EMPTY);
        }
      })
      .catch((err) => {
        this.showFlashMessage(err);
      });
  }

  showMonitoringCustomMetricsPanelState(stateName) {
    switch (stateName) {
      case PANEL_STATE.LOADING:
        this.$monitoredCustomMetricsLoading.removeClass('hidden');
        this.$monitoredCustomMetricsEmpty.addClass('hidden');
        this.$monitoredCustomMetricsList.addClass('hidden');
        this.$newCustomMetricButton.addClass('hidden');
        break;
      case PANEL_STATE.LIST:
        this.$monitoredCustomMetricsLoading.addClass('hidden');
        this.$monitoredCustomMetricsEmpty.addClass('hidden');
        this.$newCustomMetricButton.removeClass('hidden');
        this.$monitoredCustomMetricsList.removeClass('hidden');
        break;
      default:
        this.$monitoredCustomMetricsLoading.addClass('hidden');
        this.$monitoredCustomMetricsEmpty.removeClass('hidden');
        this.$monitoredCustomMetricsList.addClass('hidden');
        this.$newCustomMetricButton.addClass('hidden');
        break;
    }
  }

  populateCustomMetrics() {
    const sortedMetrics = _(this.customMetrics).chain()
      .map(metric => ({ ...metric, group: capitalizeFirstCharacter(metric.group) }))
      .sortBy('title')
      .sortBy('group')
      .value();

    sortedMetrics.forEach((metric) => {
      this.$monitoredCustomMetricsList.append(customMetricTemplate(metric));
    });

    this.$monitoredCustomMetricsCount.text(this.customMetrics.length);
    this.showMonitoringCustomMetricsPanelState(PANEL_STATE.LIST);
    if (!this.environmentsData) {
      this.showFlashMessage(s__('PrometheusService|These metrics will only be monitored after your first deployment to an environment'));
    }
    this.$monitoredCustomMetricsList.find('.delete-custom-metric').on('click', (event) => {
      this.deleteMetric(event.currentTarget);
    });
  }

  showFlashMessage(message) {
    this.$flashCustomMetricsContainer.removeClass('hidden');
    this.$flashCustomMetricsContainer.find('.flash-text').text(message);
  }

  loadActiveCustomMetrics() {
    super.loadActiveMetrics();
    Promise.all([
      axios.get(this.activeCustomMetricsEndpoint)
        .then(resp => resp.data)
        .catch(err => err),
      axios.get(this.environmentsDataEndpoint)
        .then(resp => resp.data)
        .catch(err => err),
    ])
      .then(([customMetrics, environmentsData]) => {
        this.environmentsData = environmentsData.environments;
        if (!customMetrics || !customMetrics.metrics) {
          this.showMonitoringCustomMetricsPanelState(PANEL_STATE.EMPTY);
        } else {
          this.customMetrics = customMetrics.metrics;
          this.populateCustomMetrics(customMetrics.metrics);
        }
      })
      .catch((customMetricError) => {
        this.showFlashMessage(customMetricError);
        this.showMonitoringCustomMetricsPanelState(PANEL_STATE.EMPTY);
      });
  }
}
