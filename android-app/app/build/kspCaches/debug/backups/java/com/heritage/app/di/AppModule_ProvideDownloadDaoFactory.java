package com.heritage.app.di;

import com.heritage.app.data.local.DownloadDao;
import com.heritage.app.data.local.HeritageDatabase;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.Provider;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;

@ScopeMetadata("javax.inject.Singleton")
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
public final class AppModule_ProvideDownloadDaoFactory implements Factory<DownloadDao> {
  private final Provider<HeritageDatabase> databaseProvider;

  private AppModule_ProvideDownloadDaoFactory(Provider<HeritageDatabase> databaseProvider) {
    this.databaseProvider = databaseProvider;
  }

  @Override
  public DownloadDao get() {
    return provideDownloadDao(databaseProvider.get());
  }

  public static AppModule_ProvideDownloadDaoFactory create(
      Provider<HeritageDatabase> databaseProvider) {
    return new AppModule_ProvideDownloadDaoFactory(databaseProvider);
  }

  public static DownloadDao provideDownloadDao(HeritageDatabase database) {
    return Preconditions.checkNotNullFromProvides(AppModule.INSTANCE.provideDownloadDao(database));
  }
}
