# frozen_string_literal: true

class AddAssetProxySettings < ActiveRecord::Migration[5.0]
  include Gitlab::Database::MigrationHelpers

  # Set this constant to true if this migration requires downtime.
  DOWNTIME = false

  # rubocop:disable Migration/PreventStrings
  # rubocop:disable Migration/AddLimitToTextColumns
  def change
    add_column :application_settings, :asset_proxy_enabled, :boolean, default: false, null: false
    add_column :application_settings, :asset_proxy_url, :string
    add_column :application_settings, :asset_proxy_whitelist, :text
    add_column :application_settings, :encrypted_asset_proxy_secret_key, :text
    add_column :application_settings, :encrypted_asset_proxy_secret_key_iv, :string
  end
  # rubocop:enable Migration/AddLimitToTextColumns
  # rubocop:enable Migration/PreventStrings
end
