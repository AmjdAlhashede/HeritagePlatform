package com.heritage.app.presentation.downloads;

import com.heritage.app.data.local.DownloadDao;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Provider;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;

@ScopeMetadata
@QualifierMetadata
@DaggerGenerated
@Generated(
    value = "dagger.internal.codegen.ComponentProcessor",
    comments = "https://dagger.dev"
)
@SuppressWarnings({
    "unchecked",
    "rawtypes",
    "KotlinInternal",
    "KotlinInternalInJava",
    "cast",
    "deprecation",
    "nullness:initialization.field.uninitialized"
})
public final class DownloadsViewModel_Factory implements Factory<DownloadsViewModel> {
  private final Provider<DownloadDao> downloadDaoProvider;

  private DownloadsViewModel_Factory(Provider<DownloadDao> downloadDaoProvider) {
    this.downloadDaoProvider = downloadDaoProvider;
  }

  @Override
  public DownloadsViewModel get() {
    return newInstance(downloadDaoProvider.get());
  }

  public static DownloadsViewModel_Factory create(Provider<DownloadDao> downloadDaoProvider) {
    return new DownloadsViewModel_Factory(downloadDaoProvider);
  }

  public static DownloadsViewModel newInstance(DownloadDao downloadDao) {
    return new DownloadsViewModel(downloadDao);
  }
}
