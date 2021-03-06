<script>
import { escape } from 'lodash';
import { mapState, mapGetters, createNamespacedHelpers } from 'vuex';
import { sprintf, s__ } from '~/locale';
import consts from '../../stores/modules/commit/constants';
import RadioGroup from './radio_group.vue';
import NewMergeRequestOption from './new_merge_request_option.vue';

const { mapState: mapCommitState, mapActions: mapCommitActions } = createNamespacedHelpers(
  'commit',
);

export default {
  components: {
    RadioGroup,
    NewMergeRequestOption,
  },
  computed: {
    ...mapState(['currentBranchId', 'changedFiles', 'stagedFiles']),
    ...mapCommitState(['commitAction']),
    ...mapGetters(['currentBranch', 'emptyRepo', 'canPushToBranch']),
    commitToCurrentBranchText() {
      return sprintf(
        s__('IDE|Commit to %{branchName} branch'),
        { branchName: `<strong class="monospace">${escape(this.currentBranchId)}</strong>` },
        false,
      );
    },
    containsStagedChanges() {
      return this.changedFiles.length > 0 && this.stagedFiles.length > 0;
    },
    shouldDefaultToCurrentBranch() {
      if (this.emptyRepo) {
        return true;
      }

      return this.canPushToBranch && !this.currentBranch?.default;
    },
  },
  watch: {
    containsStagedChanges() {
      this.updateSelectedCommitAction();
    },
  },
  mounted() {
    if (!this.commitAction) {
      this.updateSelectedCommitAction();
    }
  },
  methods: {
    ...mapCommitActions(['updateCommitAction']),
    updateSelectedCommitAction() {
      if (!this.currentBranch && !this.emptyRepo) {
        return;
      }

      if (this.shouldDefaultToCurrentBranch) {
        this.updateCommitAction(consts.COMMIT_TO_CURRENT_BRANCH);
      } else {
        this.updateCommitAction(consts.COMMIT_TO_NEW_BRANCH);
      }
    },
  },
  commitToCurrentBranch: consts.COMMIT_TO_CURRENT_BRANCH,
  commitToNewBranch: consts.COMMIT_TO_NEW_BRANCH,
  currentBranchPermissionsTooltip: s__(
    "IDE|This option is disabled because you don't have write permissions for the current branch.",
  ),
};
</script>

<template>
  <div class="append-bottom-15 ide-commit-options">
    <radio-group
      :value="$options.commitToCurrentBranch"
      :disabled="!canPushToBranch"
      :title="$options.currentBranchPermissionsTooltip"
    >
      <span
        class="ide-option-label"
        data-qa-selector="commit_to_current_branch_radio"
        v-html="commitToCurrentBranchText"
      ></span>
    </radio-group>
    <template v-if="!emptyRepo">
      <radio-group
        :value="$options.commitToNewBranch"
        :label="__('Create a new branch')"
        :show-input="true"
      />
      <new-merge-request-option />
    </template>
  </div>
</template>
