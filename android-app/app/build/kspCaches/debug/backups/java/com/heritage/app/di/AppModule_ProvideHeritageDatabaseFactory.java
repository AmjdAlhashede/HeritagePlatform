package com.heritage.app.di;

import android.content.Context;
import com.heritage.app.data.local.HeritageDatabase;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.Provider;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;

@ScopeMetadata("javax.inject.Singleton")
@QualifierMetadata("dagger.hilt.android.qualifiers.ApplicationContext")
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
public final class AppModule_ProvideHeritageDatabaseFactory implements Factory<HeritageDatabase> {
  private final Provider<Context> contextProvider;

  private AppModule_ProvideHeritageDatabaseFactory(Provider<Context> contextProvider) {
    this.contextProvider = contextProvider;
  }

  @Override
  public HeritageDatabase get() {
    return provideHeritageDatabase(contextProvider.get());
  }

  public static AppModule_ProvideHeritageDatabaseFactory create(Provider<Context> contextProvider) {
    return new AppModule_ProvideHeritageDatabaseFactory(contextProvider);
  }

  public static HeritageDatabase provideHeritageDatabase(Context context) {
    return Preconditions.checkNotNullFromProvides(AppModule.INSTANCE.provideHeritageDatabase(context));
  }
}
