package com.heritage.app.presentation.player;

import androidx.lifecycle.SavedStateHandle;
import com.heritage.app.domain.usecase.GetContentByIdUseCase;
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
public final class PlayerViewModel_Factory implements Factory<PlayerViewModel> {
  private final Provider<GetContentByIdUseCase> getContentByIdUseCaseProvider;

  private final Provider<SavedStateHandle> savedStateHandleProvider;

  private PlayerViewModel_Factory(Provider<GetContentByIdUseCase> getContentByIdUseCaseProvider,
      Provider<SavedStateHandle> savedStateHandleProvider) {
    this.getContentByIdUseCaseProvider = getContentByIdUseCaseProvider;
    this.savedStateHandleProvider = savedStateHandleProvider;
  }

  @Override
  public PlayerViewModel get() {
    return newInstance(getContentByIdUseCaseProvider.get(), savedStateHandleProvider.get());
  }

  public static PlayerViewModel_Factory create(
      Provider<GetContentByIdUseCase> getContentByIdUseCaseProvider,
      Provider<SavedStateHandle> savedStateHandleProvider) {
    return new PlayerViewModel_Factory(getContentByIdUseCaseProvider, savedStateHandleProvider);
  }

  public static PlayerViewModel newInstance(GetContentByIdUseCase getContentByIdUseCase,
      SavedStateHandle savedStateHandle) {
    return new PlayerViewModel(getContentByIdUseCase, savedStateHandle);
  }
}
