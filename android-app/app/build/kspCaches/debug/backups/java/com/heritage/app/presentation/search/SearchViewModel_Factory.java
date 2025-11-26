package com.heritage.app.presentation.search;

import com.heritage.app.domain.usecase.SearchContentUseCase;
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
public final class SearchViewModel_Factory implements Factory<SearchViewModel> {
  private final Provider<SearchContentUseCase> searchContentUseCaseProvider;

  private SearchViewModel_Factory(Provider<SearchContentUseCase> searchContentUseCaseProvider) {
    this.searchContentUseCaseProvider = searchContentUseCaseProvider;
  }

  @Override
  public SearchViewModel get() {
    return newInstance(searchContentUseCaseProvider.get());
  }

  public static SearchViewModel_Factory create(
      Provider<SearchContentUseCase> searchContentUseCaseProvider) {
    return new SearchViewModel_Factory(searchContentUseCaseProvider);
  }

  public static SearchViewModel newInstance(SearchContentUseCase searchContentUseCase) {
    return new SearchViewModel(searchContentUseCase);
  }
}
