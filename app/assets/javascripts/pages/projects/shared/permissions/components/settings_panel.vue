<script>
import { GlSprintf, GlLink } from '@gitlab/ui';

import settingsMixin from 'ee_else_ce/pages/projects/shared/permissions/mixins/settings_pannel_mixin';
import { s__ } from '~/locale';
import projectFeatureSetting from './project_feature_setting.vue';
import projectFeatureToggle from '~/vue_shared/components/toggle_button.vue';
import projectSettingRow from './project_setting_row.vue';
import {
  visibilityOptions,
  visibilityLevelDescriptions,
  featureAccessLevelMembers,
  featureAccessLevelEveryone,
  featureAccessLevel,
} from '../constants';
import { toggleHiddenClassBySelector } from '../external';

const PAGE_FEATURE_ACCESS_LEVEL = s__('ProjectSettings|Everyone');

export default {
  components: {
    projectFeatureSetting,
    projectFeatureToggle,
    projectSettingRow,
    GlSprintf,
    GlLink,
  },
  mixins: [settingsMixin],

  props: {
    currentSettings: {
      type: Object,
      required: true,
    },
    canDisableEmails: {
      type: Boolean,
      required: false,
      default: false,
    },
    canChangeVisibilityLevel: {
      type: Boolean,
      required: false,
      default: false,
    },
    allowedVisibilityOptions: {
      type: Array,
      required: false,
      default: () => [0, 10, 20],
    },
    lfsAvailable: {
      type: Boolean,
      required: false,
      default: false,
    },
    registryAvailable: {
      type: Boolean,
      required: false,
      default: false,
    },
    packagesAvailable: {
      type: Boolean,
      required: false,
      default: false,
    },
    visibilityHelpPath: {
      type: String,
      required: false,
      default: '',
    },
    lfsHelpPath: {
      type: String,
      required: false,
      default: '',
    },
    lfsObjectsExist: {
      type: Boolean,
      required: false,
      default: false,
    },
    lfsObjectsRemovalHelpPath: {
      type: String,
      required: false,
      default: '',
    },
    registryHelpPath: {
      type: String,
      required: false,
      default: '',
    },
    pagesAvailable: {
      type: Boolean,
      required: false,
      default: false,
    },
    pagesAccessControlEnabled: {
      type: Boolean,
      required: false,
      default: false,
    },
    pagesAccessControlForced: {
      type: Boolean,
      required: false,
      default: false,
    },
    pagesHelpPath: {
      type: String,
      required: false,
      default: '',
    },
    packagesHelpPath: {
      type: String,
      required: false,
      default: '',
    },
  },
  data() {
    const defaults = {
      visibilityOptions,
      visibilityLevel: visibilityOptions.PUBLIC,
      // TODO: Change all of these to use the visibilityOptions constants
      // https://gitlab.com/gitlab-org/gitlab/-/issues/214667
      issuesAccessLevel: 20,
      repositoryAccessLevel: 20,
      forkingAccessLevel: 20,
      mergeRequestsAccessLevel: 20,
      buildsAccessLevel: 20,
      wikiAccessLevel: 20,
      snippetsAccessLevel: 20,
      pagesAccessLevel: 20,
      metricsDashboardAccessLevel: featureAccessLevel.PROJECT_MEMBERS,
      containerRegistryEnabled: true,
      lfsEnabled: true,
      requestAccessEnabled: true,
      highlightChangesClass: false,
      emailsDisabled: false,
      featureAccessLevelEveryone,
      featureAccessLevelMembers,
    };

    return { ...defaults, ...this.currentSettings };
  },

  computed: {
    featureAccessLevelOptions() {
      const options = [featureAccessLevelMembers];
      if (this.visibilityLevel !== visibilityOptions.PRIVATE) {
        options.push(featureAccessLevelEveryone);
      }
      return options;
    },

    repoFeatureAccessLevelOptions() {
      return this.featureAccessLevelOptions.filter(
        ([value]) => value <= this.repositoryAccessLevel,
      );
    },

    pagesFeatureAccessLevelOptions() {
      const options = [featureAccessLevelMembers];

      if (this.pagesAccessControlForced) {
        if (this.visibilityLevel === visibilityOptions.INTERNAL) {
          options.push(featureAccessLevelEveryone);
        }
      } else {
        if (this.visibilityLevel !== visibilityOptions.PRIVATE) {
          options.push(featureAccessLevelEveryone);
        }

        if (this.visibilityLevel !== visibilityOptions.PUBLIC) {
          options.push([30, PAGE_FEATURE_ACCESS_LEVEL]);
        }
      }
      return options;
    },

    metricsOptionsDropdownEnabled() {
      return this.featureAccessLevelOptions.length < 2;
    },

    repositoryEnabled() {
      return this.repositoryAccessLevel > 0;
    },

    visibilityLevelDescription() {
      return visibilityLevelDescriptions[this.visibilityLevel];
    },

    showContainerRegistryPublicNote() {
      return this.visibilityLevel === visibilityOptions.PUBLIC;
    },

    repositoryHelpText() {
      if (this.visibilityLevel === visibilityOptions.PRIVATE) {
        return s__('ProjectSettings|View and edit files in this project');
      }

      return s__(
        'ProjectSettings|View and edit files in this project. Non-project members will only have read access',
      );
    },
  },

  watch: {
    visibilityLevel(value, oldValue) {
      if (value === visibilityOptions.PRIVATE) {
        // when private, features are restricted to "only team members"
        this.issuesAccessLevel = Math.min(10, this.issuesAccessLevel);
        this.repositoryAccessLevel = Math.min(10, this.repositoryAccessLevel);
        this.mergeRequestsAccessLevel = Math.min(10, this.mergeRequestsAccessLevel);
        this.buildsAccessLevel = Math.min(10, this.buildsAccessLevel);
        this.wikiAccessLevel = Math.min(10, this.wikiAccessLevel);
        this.snippetsAccessLevel = Math.min(10, this.snippetsAccessLevel);
        this.metricsDashboardAccessLevel = Math.min(10, this.metricsDashboardAccessLevel);
        if (this.pagesAccessLevel === 20) {
          // When from Internal->Private narrow access for only members
          this.pagesAccessLevel = 10;
        }
        this.highlightChanges();
      } else if (oldValue === visibilityOptions.PRIVATE) {
        // if changing away from private, make enabled features more permissive
        if (this.issuesAccessLevel > 0) this.issuesAccessLevel = 20;
        if (this.repositoryAccessLevel > 0) this.repositoryAccessLevel = 20;
        if (this.mergeRequestsAccessLevel > 0) this.mergeRequestsAccessLevel = 20;
        if (this.buildsAccessLevel > 0) this.buildsAccessLevel = 20;
        if (this.wikiAccessLevel > 0) this.wikiAccessLevel = 20;
        if (this.snippetsAccessLevel > 0) this.snippetsAccessLevel = 20;
        if (this.pagesAccessLevel === 10) this.pagesAccessLevel = 20;
        if (this.metricsDashboardAccessLevel === 10) this.metricsDashboardAccessLevel = 20;
        this.highlightChanges();
      }
    },

    issuesAccessLevel(value, oldValue) {
      if (value === 0) toggleHiddenClassBySelector('.issues-feature', true);
      else if (oldValue === 0) toggleHiddenClassBySelector('.issues-feature', false);
    },

    mergeRequestsAccessLevel(value, oldValue) {
      if (value === 0) toggleHiddenClassBySelector('.merge-requests-feature', true);
      else if (oldValue === 0) toggleHiddenClassBySelector('.merge-requests-feature', false);
    },
  },

  methods: {
    highlightChanges() {
      this.highlightChangesClass = true;
      this.$nextTick(() => {
        this.highlightChangesClass = false;
      });
    },

    visibilityAllowed(option) {
      return this.allowedVisibilityOptions.includes(option);
    },
  },
};
</script>

<template>
  <div>
    <div class="project-visibility-setting">
      <project-setting-row
        ref="project-visibility-settings"
        :help-path="visibilityHelpPath"
        :label="s__('ProjectSettings|Project visibility')"
      >
        <div class="project-feature-controls">
          <div class="select-wrapper">
            <select
              v-model="visibilityLevel"
              :disabled="!canChangeVisibilityLevel"
              name="project[visibility_level]"
              class="form-control select-control"
              data-qa-selector="project_visibility_dropdown"
            >
              <option
                :value="visibilityOptions.PRIVATE"
                :disabled="!visibilityAllowed(visibilityOptions.PRIVATE)"
                >{{ s__('ProjectSettings|Private') }}</option
              >
              <option
                :value="visibilityOptions.INTERNAL"
                :disabled="!visibilityAllowed(visibilityOptions.INTERNAL)"
                >{{ s__('ProjectSettings|Internal') }}</option
              >
              <option
                :value="visibilityOptions.PUBLIC"
                :disabled="!visibilityAllowed(visibilityOptions.PUBLIC)"
                >{{ s__('ProjectSettings|Public') }}</option
              >
            </select>
            <i aria-hidden="true" data-hidden="true" class="fa fa-chevron-down"></i>
          </div>
        </div>
        <span class="form-text text-muted">{{ visibilityLevelDescription }}</span>
        <label v-if="visibilityLevel !== visibilityOptions.PRIVATE" class="request-access">
          <input
            :value="requestAccessEnabled"
            type="hidden"
            name="project[request_access_enabled]"
          />
          <input v-model="requestAccessEnabled" type="checkbox" />
          {{ s__('ProjectSettings|Allow users to request access') }}
        </label>
      </project-setting-row>
    </div>
    <div :class="{ 'highlight-changes': highlightChangesClass }" class="project-feature-settings">
      <project-setting-row
        ref="issues-settings"
        :label="s__('ProjectSettings|Issues')"
        :help-text="s__('ProjectSettings|Lightweight issue tracking system for this project')"
      >
        <project-feature-setting
          v-model="issuesAccessLevel"
          :options="featureAccessLevelOptions"
          name="project[project_feature_attributes][issues_access_level]"
        />
      </project-setting-row>
      <project-setting-row
        ref="repository-settings"
        :label="s__('ProjectSettings|Repository')"
        :help-text="repositoryHelpText"
      >
        <project-feature-setting
          v-model="repositoryAccessLevel"
          :options="featureAccessLevelOptions"
          name="project[project_feature_attributes][repository_access_level]"
        />
      </project-setting-row>
      <div class="project-feature-setting-group">
        <project-setting-row
          ref="merge-request-settings"
          :label="s__('ProjectSettings|Merge requests')"
          :help-text="s__('ProjectSettings|Submit changes to be merged upstream')"
        >
          <project-feature-setting
            v-model="mergeRequestsAccessLevel"
            :options="repoFeatureAccessLevelOptions"
            :disabled-input="!repositoryEnabled"
            name="project[project_feature_attributes][merge_requests_access_level]"
          />
        </project-setting-row>
        <project-setting-row
          ref="fork-settings"
          :label="s__('ProjectSettings|Forks')"
          :help-text="
            s__('ProjectSettings|Allow users to make copies of your repository to a new project')
          "
        >
          <project-feature-setting
            v-model="forkingAccessLevel"
            :options="featureAccessLevelOptions"
            :disabled-input="!repositoryEnabled"
            name="project[project_feature_attributes][forking_access_level]"
          />
        </project-setting-row>
        <project-setting-row
          ref="pipeline-settings"
          :label="s__('ProjectSettings|Pipelines')"
          :help-text="s__('ProjectSettings|Build, test, and deploy your changes')"
        >
          <project-feature-setting
            v-model="buildsAccessLevel"
            :options="repoFeatureAccessLevelOptions"
            :disabled-input="!repositoryEnabled"
            name="project[project_feature_attributes][builds_access_level]"
          />
        </project-setting-row>
        <project-setting-row
          v-if="registryAvailable"
          ref="container-registry-settings"
          :help-path="registryHelpPath"
          :label="s__('ProjectSettings|Container registry')"
          :help-text="
            s__('ProjectSettings|Every project can have its own space to store its Docker images')
          "
        >
          <div v-if="showContainerRegistryPublicNote" class="text-muted">
            {{
              s__(
                'ProjectSettings|Note: the container registry is always visible when a project is public',
              )
            }}
          </div>
          <project-feature-toggle
            v-model="containerRegistryEnabled"
            :disabled-input="!repositoryEnabled"
            name="project[container_registry_enabled]"
          />
        </project-setting-row>
        <project-setting-row
          v-if="lfsAvailable"
          ref="git-lfs-settings"
          :help-path="lfsHelpPath"
          :label="s__('ProjectSettings|Git Large File Storage')"
          :help-text="
            s__('ProjectSettings|Manages large files such as audio, video, and graphics files')
          "
        >
          <project-feature-toggle
            v-model="lfsEnabled"
            :disabled-input="!repositoryEnabled"
            name="project[lfs_enabled]"
          />
          <p v-if="!lfsEnabled && lfsObjectsExist">
            <gl-sprintf
              :message="
                s__(
                  'ProjectSettings|LFS objects from this repository are still available to forks. %{linkStart}How do I remove them?%{linkEnd}',
                )
              "
            >
              <template #link="{ content }">
                <span class="d-block">
                  <gl-link :href="lfsObjectsRemovalHelpPath" target="_blank">
                    {{ content }}
                  </gl-link>
                </span>
              </template>
            </gl-sprintf>
          </p>
        </project-setting-row>
        <project-setting-row
          v-if="packagesAvailable"
          ref="package-settings"
          :help-path="packagesHelpPath"
          :label="s__('ProjectSettings|Packages')"
          :help-text="
            s__('ProjectSettings|Every project can have its own space to store its packages')
          "
        >
          <project-feature-toggle
            v-model="packagesEnabled"
            :disabled-input="!repositoryEnabled"
            name="project[packages_enabled]"
          />
        </project-setting-row>
      </div>
      <project-setting-row
        ref="wiki-settings"
        :label="s__('ProjectSettings|Wiki')"
        :help-text="s__('ProjectSettings|Pages for project documentation')"
      >
        <project-feature-setting
          v-model="wikiAccessLevel"
          :options="featureAccessLevelOptions"
          name="project[project_feature_attributes][wiki_access_level]"
        />
      </project-setting-row>
      <project-setting-row
        ref="snippet-settings"
        :label="s__('ProjectSettings|Snippets')"
        :help-text="s__('ProjectSettings|Share code pastes with others out of Git repository')"
      >
        <project-feature-setting
          v-model="snippetsAccessLevel"
          :options="featureAccessLevelOptions"
          name="project[project_feature_attributes][snippets_access_level]"
        />
      </project-setting-row>
      <project-setting-row
        v-if="pagesAvailable && pagesAccessControlEnabled"
        ref="pages-settings"
        :help-path="pagesHelpPath"
        :label="s__('ProjectSettings|Pages')"
        :help-text="
          s__('ProjectSettings|With GitLab Pages you can host your static websites on GitLab')
        "
      >
        <project-feature-setting
          v-model="pagesAccessLevel"
          :options="pagesFeatureAccessLevelOptions"
          name="project[project_feature_attributes][pages_access_level]"
        />
      </project-setting-row>
      <project-setting-row
        ref="metrics-visibility-settings"
        :label="__('Metrics Dashboard')"
        :help-text="
          s__(
            'ProjectSettings|With Metrics Dashboard you can visualize this project performance metrics',
          )
        "
      >
        <div class="project-feature-controls">
          <div class="select-wrapper">
            <select
              v-model="metricsDashboardAccessLevel"
              :disabled="metricsOptionsDropdownEnabled"
              name="project[project_feature_attributes][metrics_dashboard_access_level]"
              class="form-control project-repo-select select-control"
            >
              <option
                :value="featureAccessLevelMembers[0]"
                :disabled="!visibilityAllowed(visibilityOptions.INTERNAL)"
                >{{ featureAccessLevelMembers[1] }}</option
              >
              <option
                :value="featureAccessLevelEveryone[0]"
                :disabled="!visibilityAllowed(visibilityOptions.PUBLIC)"
                >{{ featureAccessLevelEveryone[1] }}</option
              >
            </select>
            <i aria-hidden="true" data-hidden="true" class="fa fa-chevron-down"></i>
          </div>
        </div>
      </project-setting-row>
    </div>
    <project-setting-row v-if="canDisableEmails" ref="email-settings" class="mb-3">
      <label class="js-emails-disabled">
        <input :value="emailsDisabled" type="hidden" name="project[emails_disabled]" />
        <input v-model="emailsDisabled" type="checkbox" />
        {{ s__('ProjectSettings|Disable email notifications') }}
      </label>
      <span class="form-text text-muted">{{
        s__(
          'ProjectSettings|This setting will override user notification preferences for all project members.',
        )
      }}</span>
    </project-setting-row>
  </div>
</template>
