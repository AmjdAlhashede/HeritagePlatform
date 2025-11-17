package com.heritage.app.di;

import com.heritage.app.data.remote.api.HeritageApi;
import com.heritage.app.domain.repository.ContentRepository;
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
public final class AppModule_ProvideContentRepositoryFactory implements Factory<ContentRepository> {
  private final Provider<HeritageApi> apiProvider;

  private AppModule_ProvideContentRepositoryFactory(Provider<HeritageApi> apiProvider) {
    this.apiProvider = apiProvider;
  }

  @Override
  public ContentRepository get() {
    return provideContentRepository(apiProvider.get());
  }

  public static AppModule_ProvideContentRepositoryFactory create(
      Provider<HeritageApi> apiProvider) {
    return new AppModule_ProvideContentRepositoryFactory(apiProvider);
  }

  public static ContentRepository provideContentRepository(HeritageApi api) {
    return Preconditions.checkNotNullFromProvides(AppModule.INSTANCE.provideContentRepository(api));
  }
}
