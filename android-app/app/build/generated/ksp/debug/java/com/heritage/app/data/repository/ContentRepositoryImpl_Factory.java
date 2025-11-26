package com.heritage.app.data.repository;

import com.heritage.app.data.remote.api.HeritageApi;
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
public final class ContentRepositoryImpl_Factory implements Factory<ContentRepositoryImpl> {
  private final Provider<HeritageApi> apiProvider;

  private ContentRepositoryImpl_Factory(Provider<HeritageApi> apiProvider) {
    this.apiProvider = apiProvider;
  }

  @Override
  public ContentRepositoryImpl get() {
    return newInstance(apiProvider.get());
  }

  public static ContentRepositoryImpl_Factory create(Provider<HeritageApi> apiProvider) {
    return new ContentRepositoryImpl_Factory(apiProvider);
  }

  public static ContentRepositoryImpl newInstance(HeritageApi api) {
    return new ContentRepositoryImpl(api);
  }
}
