package com.heritage.app.presentation.content_detail;

import com.heritage.app.domain.repository.ContentRepository;
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
public final class ContentDetailViewModel_Factory implements Factory<ContentDetailViewModel> {
  private final Provider<ContentRepository> repositoryProvider;

  private ContentDetailViewModel_Factory(Provider<ContentRepository> repositoryProvider) {
    this.repositoryProvider = repositoryProvider;
  }

  @Override
  public ContentDetailViewModel get() {
    return newInstance(repositoryProvider.get());
  }

  public static ContentDetailViewModel_Factory create(
      Provider<ContentRepository> repositoryProvider) {
    return new ContentDetailViewModel_Factory(repositoryProvider);
  }

  public static ContentDetailViewModel newInstance(ContentRepository repository) {
    return new ContentDetailViewModel(repository);
  }
}
