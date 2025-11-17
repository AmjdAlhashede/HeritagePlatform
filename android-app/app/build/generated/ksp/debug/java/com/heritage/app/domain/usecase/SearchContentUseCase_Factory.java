package com.heritage.app.domain.usecase;

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
public final class SearchContentUseCase_Factory implements Factory<SearchContentUseCase> {
  private final Provider<ContentRepository> repositoryProvider;

  private SearchContentUseCase_Factory(Provider<ContentRepository> repositoryProvider) {
    this.repositoryProvider = repositoryProvider;
  }

  @Override
  public SearchContentUseCase get() {
    return newInstance(repositoryProvider.get());
  }

  public static SearchContentUseCase_Factory create(
      Provider<ContentRepository> repositoryProvider) {
    return new SearchContentUseCase_Factory(repositoryProvider);
  }

  public static SearchContentUseCase newInstance(ContentRepository repository) {
    return new SearchContentUseCase(repository);
  }
}
